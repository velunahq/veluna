<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Moon02Icon,
		Cancel01Icon,
		Clock01Icon,
		Tick02Icon
	} from '@hugeicons/core-free-icons';
	import { Button } from './ui/button';
	import { sleepTimer, type SleepTimerOption } from '$lib/sleeptimer.svelte';
	import { t, type TranslationKey } from '$lib/i18n.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const options: { id: SleepTimerOption; labelKey: TranslationKey }[] = [
		{ id: 5, labelKey: 'sleep_timer.opt_5' },
		{ id: 10, labelKey: 'sleep_timer.opt_10' },
		{ id: 15, labelKey: 'sleep_timer.opt_15' },
		{ id: 30, labelKey: 'sleep_timer.opt_30' },
		{ id: 45, labelKey: 'sleep_timer.opt_45' },
		{ id: 60, labelKey: 'sleep_timer.opt_60' },
		{ id: -1, labelKey: 'sleep_timer.opt_end_song' },
		{ id: -2, labelKey: 'sleep_timer.opt_end_queue' }
	];

	function selectOption(id: SleepTimerOption) {
		sleepTimer.setTimer(id);
		open = false;
	}

	function turnOff() {
		sleepTimer.cancel();
		open = false;
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		transition:fade={{ duration: 150 }}
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) open = false;
		}}
	>
		<div
			class="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl"
			transition:scale={{ duration: 180, start: 0.96, easing: cubicOut }}
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b px-5 py-4">
				<div class="flex items-center gap-2">
					<HugeiconsIcon icon={Moon02Icon} class="h-5 w-5 text-primary" />
					<h2 class="text-base font-semibold">{t('sleep_timer.title')}</h2>
				</div>
				<button
					class="rounded-full p-1 text-muted-foreground hover:bg-accent/20 hover:text-foreground"
					onclick={() => (open = false)}
					aria-label={t('common.close')}
				>
					<HugeiconsIcon icon={Cancel01Icon} class="h-4 w-4" />
				</button>
			</div>

			<!-- Active indicator if set -->
			{#if sleepTimer.active}
				<div class="flex items-center justify-between bg-primary/10 px-5 py-3 text-xs text-primary">
					<div class="flex items-center gap-2 font-medium">
						<HugeiconsIcon icon={Clock01Icon} class="h-4 w-4 animate-pulse" />
						<span>{t('sleep_timer.active_countdown', { time: sleepTimer.formatted })}</span>
					</div>
					<button
						class="font-medium underline hover:text-primary/80"
						onclick={turnOff}
					>
						{t('sleep_timer.turn_off')}
					</button>
				</div>
			{/if}

			<!-- Options List -->
			<div class="flex flex-col gap-1 p-3">
				{#each options as opt (opt.id)}
					{@const isSelected = sleepTimer.activeMode === opt.id}
					<button
						class="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition-colors {isSelected ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-muted text-foreground'}"
						onclick={() => selectOption(opt.id)}
					>
						<span>{t(opt.labelKey)}</span>
						{#if isSelected}
							<HugeiconsIcon icon={Tick02Icon} class="h-4 w-4 text-primary" />
						{/if}
					</button>
				{/each}
			</div>

			{#if sleepTimer.active}
				<div class="border-t p-3">
					<Button variant="ghost" class="w-full text-destructive hover:bg-destructive/10" onclick={turnOff}>
						{t('sleep_timer.turn_off')}
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}
