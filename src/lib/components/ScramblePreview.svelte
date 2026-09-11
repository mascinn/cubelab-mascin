<script lang="ts">
  import { X, Layers } from 'lucide-svelte';
  import { computeScrambleStickers, BASE_STICKERS, type CubeSticker } from '$lib/utils/scramble-net';

  let {
    scramble = '',
    isZenActive = false,
    isOpen = false,
    onClose
  } = $props<{
    scramble: string;
    isZenActive?: boolean;
    isOpen: boolean;
    onClose?: () => void;
  }>();

  // Stickers reactive state initialized with base solved state
  let stickers = $state<CubeSticker[]>(
    BASE_STICKERS.map((s) => ({ ...s, color: s.defaultColor }))
  );

  // Compute 2D net colors reactively whenever scramble changes
  $effect(() => {
    const current = scramble;
    computeScrambleStickers(current).then((result) => {
      stickers = result;
    });
  });

  // Close on Escape key
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen && onClose) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- Docked 2D Net Scramble Preview: Bottom-Right corner (csTimer style, never overlaps timer) -->
{#if isOpen && !isZenActive}
  <div
    class="
      z-30 transition-all duration-300 select-none
      fixed md:absolute bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-6 md:right-8
      w-[215px] sm:w-[235px] md:w-[245px]
      frosted-card rounded-2xl p-3
      shadow-xl border border-zinc-200/80 dark:border-zinc-800/90
    "
    role="region"
    aria-label="Draw Scramble Preview"
  >
    <!-- Header -->
    <div class="flex items-center justify-between pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
      <div class="flex items-center gap-1.5">
        <div class="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Layers size={11} />
        </div>
        <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
          Draw Scramble
        </span>
      </div>

      <!-- Close Button -->
      {#if onClose}
        <button
          onclick={onClose}
          class="p-1 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          title="Hide preview (P)"
          aria-label="Hide preview"
        >
          <X size={13} />
        </button>
      {/if}
    </div>

    <!-- 2D Net Canvas SVG Viewport Area -->
    <div class="relative w-full h-[145px] sm:h-[155px] my-2 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-center p-2 overflow-hidden">
      <svg
        viewBox="-0.1 -0.1 12.9 9.7"
        class="w-full h-full max-h-[140px] select-none filter drop-shadow-xs"
        preserveAspectRatio="xMidYMid meet"
      >
        {#each stickers as sticker (sticker.id)}
          <rect
            x={sticker.x + 0.04}
            y={sticker.y + 0.04}
            width="0.92"
            height="0.92"
            rx="0.1"
            fill={sticker.color}
            stroke="#18181b"
            stroke-width="0.04"
            class="transition-colors duration-200"
          />
        {/each}
      </svg>
    </div>

    <!-- Face Orientation Legend & WCA Helper -->
    <div class="flex items-center justify-between pt-1.5 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[10px] font-mono">
      <div class="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
        <span class="inline-flex items-center gap-1" title="Up: White">
          <span class="w-1.5 h-1.5 rounded-full bg-white border border-zinc-300 shadow-xs"></span>
          <span>U</span>
        </span>
        <span class="inline-flex items-center gap-1" title="Front: Green">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-xs"></span>
          <span>F</span>
        </span>
        <span class="inline-flex items-center gap-1" title="Left: Orange">
          <span class="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-xs"></span>
          <span>L</span>
        </span>
        <span class="inline-flex items-center gap-1" title="Right: Red">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 shadow-xs"></span>
          <span>R</span>
        </span>
        <span class="inline-flex items-center gap-1" title="Back: Blue">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-xs"></span>
          <span>B</span>
        </span>
        <span class="inline-flex items-center gap-1" title="Down: Yellow">
          <span class="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-xs"></span>
          <span>D</span>
        </span>
      </div>

      <span class="text-[9px] text-zinc-400" title="Shortcut P to toggle">
        <kbd class="px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[8px]">P</kbd>
      </span>
    </div>
  </div>
{/if}
