import * as api from './api';
import type { NowPlaying } from './api';
import { playback, toast } from './player.svelte';
import { t } from './i18n.svelte';

export type SleepTimerOption = 0 | 5 | 10 | 15 | 30 | 45 | 60 | -1 | -2;

class SleepTimerStore {
	/** Remaining seconds until sleep timer fires; null if inactive */
	remaining = $state<number | null>(null);
	/** Selected mode: minutes, or -1 (end of song), or -2 (end of queue) */
	activeMode = $state<SleepTimerOption>(0);
	/** Track ID when "end of song" timer was primed */
	private primedSongId: string | null = null;
	/** Interval timer reference */
	private intervalId: ReturnType<typeof setInterval> | null = null;
	/** Stored volume before fading */
	private originalVolume: number | null = null;

	get active(): boolean {
		return this.remaining !== null || this.activeMode === -1 || this.activeMode === -2;
	}

	get formatted(): string {
		if (this.activeMode === -1) return t('sleep_timer.end_of_song');
		if (this.activeMode === -2) return t('sleep_timer.end_of_queue');
		if (this.remaining === null) return '';
		const m = Math.floor(this.remaining / 60);
		const s = this.remaining % 60;
		return `${m}:${s < 10 ? '0' : ''}${s}`;
	}

	constructor() {
		if (typeof window !== 'undefined') {
			// Listen to song changes for "End of current track" mode
			api.onNowPlaying((n: NowPlaying) => {
				if (this.activeMode === -1 && this.primedSongId && n.videoId !== this.primedSongId) {
					this.triggerSleep();
				}
			});

			// Listen to queue completion for "End of queue" mode
			api.onPlaybackState((state: 'playing' | 'paused') => {
				if (this.activeMode === -2 && state === 'paused') {
					const isLastTrack =
						playback.queue.items.length > 0 &&
						playback.queue.currentIndex >= playback.queue.items.length - 1;
					if (isLastTrack) {
						this.cancel();
						toast.info(t('sleep_timer.toast_fired'));
					}
				}
			});
		}
	}

	/** Start a sleep timer with the specified minutes, or end of track (-1) */
	setTimer(option: SleepTimerOption) {
		this.cancel();

		if (option === 0) {
			return;
		}

		this.activeMode = option;

		if (option === -1) {
			// End of current track
			this.primedSongId = playback.now?.videoId ?? null;
			toast.info(t('sleep_timer.toast_set_end_of_song'));
			return;
		}

		if (option === -2) {
			// End of queue
			toast.info(t('sleep_timer.toast_set_end_of_queue'));
			return;
		}

		// Timed in minutes
		this.remaining = option * 60;
		toast.info(t('sleep_timer.toast_set_minutes', { minutes: option }));

		this.intervalId = setInterval(() => {
			if (this.remaining === null) return;
			this.remaining -= 1;

			// Fade out volume in the last 15 seconds
			if (this.remaining <= 15 && this.remaining > 0) {
				if (this.originalVolume === null) {
					this.originalVolume = playback.volume;
				}
				const factor = this.remaining / 15;
				const faded = Math.max(0, Math.round(this.originalVolume * factor));
				api.setVolume(faded).catch(() => {});
			}

			if (this.remaining <= 0) {
				this.triggerSleep();
			}
		}, 1000);
	}

	/** Cancel the active timer and restore volume if it was fading */
	cancel() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		if (this.originalVolume !== null) {
			api.setVolume(this.originalVolume).catch(() => {});
			this.originalVolume = null;
		}
		this.remaining = null;
		this.activeMode = 0;
		this.primedSongId = null;
	}

	/** Trigger the sleep: pause playback and clean up timer state */
	private async triggerSleep() {
		const origVol = this.originalVolume;
		this.cancel();

		try {
			if (!playback.paused) {
				await api.togglePause();
			}
			// Restore original volume so next playback isn't muted
			if (origVol !== null) {
				await api.setVolume(origVol);
			}
			toast.info(t('sleep_timer.toast_fired'));
		} catch (e) {
			console.error('Failed to trigger sleep timer pause', e);
		}
	}
}

export const sleepTimer = new SleepTimerStore();
