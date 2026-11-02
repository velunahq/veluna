<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Cancel01Icon,
		Download01Icon,
		Folder01Icon,
		Tick02Icon,
		AlertCircleIcon,
		Loading03Icon,
		Clock01Icon
	} from '@hugeicons/core-free-icons';
	import { Button } from './ui/button';
	import { downloadManager } from '$lib/download.svelte';
	import * as api from '$lib/api';
	import { t } from '$lib/i18n.svelte';

	let { onClose }: { onClose: () => void } = $props();

	function formatSpeed(mbps: number): string {
		if (mbps < 0.1) return '';
		return `${mbps.toFixed(1)} MB/s`;
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024 * 1024) {
			return `${(bytes / 1024).toFixed(0)} KB`;
		}
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<!-- Backdrop on smaller screens -->
<button
	class="absolute inset-0 z-20 cursor-default bg-black/40 lg:hidden"
	onclick={onClose}
	aria-label={t('common.close')}
	transition:fade={{ duration: 150 }}
></button>

<aside
	transition:fly={{ x: 32, duration: 220, easing: cubicOut }}
	class="absolute inset-y-0 right-0 z-30 flex h-full w-84 max-w-[85vw] flex-col border-l bg-card/95 shadow-2xl backdrop-blur-md"
>
	<!-- Header -->
	<div class="flex items-center justify-between border-b px-4 py-3">
		<div class="flex items-center gap-2">
			<HugeiconsIcon icon={Download01Icon} class="h-4 w-4 text-primary" />
			<h2 class="font-heading text-sm font-semibold">{t('download.panel_title')}</h2>
			{#if downloadManager.activeCount > 0}
				<span class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
					{downloadManager.activeCount}
				</span>
			{/if}
		</div>
		<div class="flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon-sm"
				title={t('download.open_folder')}
				aria-label={t('download.open_folder')}
				onclick={() => downloadManager.openFolder()}
			>
				<HugeiconsIcon icon={Folder01Icon} class="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				title={t('common.close')}
				aria-label={t('common.close')}
				onclick={onClose}
			>
				<HugeiconsIcon icon={Cancel01Icon} class="h-4 w-4" />
			</Button>
		</div>
	</div>

	<!-- Controls bar -->
	{#if downloadManager.items.length > 0}
		<div class="flex items-center justify-between border-b bg-muted/20 px-4 py-2 text-xs">
			<span class="text-muted-foreground">
				{downloadManager.items.length} {downloadManager.items.length === 1 ? 'item' : 'items'}
			</span>
			<div class="flex items-center gap-2">
				{#if downloadManager.activeCount > 0}
					<button
						class="text-xs text-muted-foreground hover:text-foreground hover:underline"
						onclick={() => downloadManager.cancelAll()}
					>
						{t('download.cancel_all')}
					</button>
				{/if}
				{#if downloadManager.items.some((d) => d.status === 'completed' || d.status === 'failed' || d.status === 'cancelled')}
					<button
						class="text-xs text-muted-foreground hover:text-foreground hover:underline"
						onclick={() => downloadManager.clearCompleted()}
					>
						{t('download.clear_completed')}
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Downloads list -->
	<div class="flex-1 overflow-y-auto divide-y divide-border/50">
		{#if downloadManager.items.length === 0}
			<div class="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
				<HugeiconsIcon icon={Download01Icon} class="h-8 w-8 stroke-[1.5] opacity-40" />
				<p class="text-sm font-medium">{t('download.no_downloads')}</p>
				<p class="text-xs text-muted-foreground/80">{t('download.no_downloads_sub')}</p>
			</div>
		{:else}
			{#each downloadManager.items as item (item.id)}
				<div class="flex flex-col gap-1.5 p-3.5 hover:bg-muted/10 transition-colors">
					<!-- Title and Status Row -->
					<div class="flex items-start justify-between gap-2">
						<div class="min-w-0 flex-1">
							<p class="truncate text-xs font-medium text-foreground" title={item.title}>
								{item.title}
							</p>
							<p class="truncate text-[11px] text-muted-foreground" title={item.artists}>
								{item.artists}
							</p>
						</div>

						<!-- Action icon / status badge -->
						<div class="flex items-center gap-1 shrink-0">
							{#if item.status === 'queued'}
								<span class="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
									<HugeiconsIcon icon={Clock01Icon} class="h-3 w-3" />
									{t('download.status_queued')}
								</span>
								<button
									class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
									title={t('common.cancel')}
									onclick={() => downloadManager.cancel(item.id)}
								>
									<HugeiconsIcon icon={Cancel01Icon} class="h-3.5 w-3.5" />
								</button>
							{:else if item.status === 'downloading'}
								<button
									class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
									title={t('common.cancel')}
									onclick={() => downloadManager.cancel(item.id)}
								>
									<HugeiconsIcon icon={Cancel01Icon} class="h-3.5 w-3.5" />
								</button>
							{:else if item.status === 'transcoding' || item.status === 'tagging'}
								<span class="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary animate-pulse">
									<HugeiconsIcon icon={Loading03Icon} class="h-3 w-3 animate-spin" />
									{item.status === 'transcoding' ? t('download.status_transcoding') : t('download.status_tagging')}
								</span>
							{:else if item.status === 'completed'}
								<span class="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-500">
									<HugeiconsIcon icon={Tick02Icon} class="h-3 w-3" />
									{t('download.status_completed')}
								</span>
								{#if item.file_path}
									<button
										class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
										title={t('download.show_in_folder')}
										onclick={() => api.showItemInFolder(item.file_path!)}
									>
										<HugeiconsIcon icon={Folder01Icon} class="h-3.5 w-3.5" />
									</button>
								{/if}
							{:else if item.status === 'failed'}
								<span class="flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive" title={item.error ?? ''}>
									<HugeiconsIcon icon={AlertCircleIcon} class="h-3 w-3" />
									{t('download.status_failed')}
								</span>
							{:else if item.status === 'cancelled'}
								<span class="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
									{t('download.status_cancelled')}
								</span>
							{/if}
						</div>
					</div>

					<!-- Progress bar for active downloads -->
					{#if item.status === 'downloading' || item.status === 'transcoding' || item.status === 'tagging'}
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								class="h-full bg-primary transition-all duration-200"
								style="width: {Math.max(item.percent, 3)}%"
							></div>
						</div>
						<div class="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
							<span>
								{#if item.total_bytes > 0}
									{formatBytes(item.bytes_downloaded)} / {formatBytes(item.total_bytes)}
								{:else if item.bytes_downloaded > 0}
									{formatBytes(item.bytes_downloaded)}
								{:else}
									{item.percent.toFixed(0)}%
								{/if}
							</span>
							{#if item.speed_mbps > 0.05 && item.status === 'downloading'}
								<span>{formatSpeed(item.speed_mbps)}</span>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</aside>
