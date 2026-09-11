<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { ALGORITHMS } from '$lib/data/algorithms';
  import type { AlgorithmItem } from '$lib/types';
  import { X, Play, RotateCcw, Copy, Check, Sparkles, BookOpen } from 'lucide-svelte';

  let {
    isOpen = false,
    onClose
  } = $props<{
    isOpen?: boolean;
    onClose?: () => void;
  }>();

  let activeCategory = $state<'PLL' | 'OLL' | 'F2L'>('PLL');
  let selectedAlg = $state<AlgorithmItem | null>(null);
  let twistyLoaded = $state(false);
  let twistyContainer = $state<HTMLDivElement | null>(null);
  let twistyElement: any = null;
  let copiedAlgId = $state<string | null>(null);
  const categories = ['PLL', 'OLL', 'F2L'] as const;

  const filteredAlgs = $derived(ALGORITHMS.filter((a) => a.category === activeCategory));

  onMount(async () => {
    if (browser) {
      try {
        await import('cubing/twisty');
        twistyLoaded = true;
      } catch (err) {
        console.error('Failed to load cubing/twisty:', err);
      }
    }
  });

  // Whenever selectedAlg changes and modal is open, mount or update TwistyPlayer
  $effect(() => {
    if (twistyLoaded && selectedAlg && twistyContainer) {
      // Clear previous
      twistyContainer.innerHTML = '';

      // Create <twisty-player>
      try {
        const player = document.createElement('twisty-player') as any;
        player.setAttribute('puzzle', '3x3x3');
        player.setAttribute('alg', selectedAlg.alg);
        player.setAttribute('visualization', '3D');
        player.setAttribute('background', 'none');
        player.setAttribute('control-panel', 'bottom-row');
        player.style.width = '100%';
        player.style.height = '280px';
        twistyContainer.appendChild(player);
        twistyElement = player;
      } catch (e) {
        console.error('Error mounting twisty-player:', e);
      }
    }
  });

  function selectAlgorithm(item: AlgorithmItem) {
    selectedAlg = item;
  }

  function closeVisualizer() {
    selectedAlg = null;
  }

  function copyAlg(item: AlgorithmItem, e: MouseEvent) {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(item.alg);
      copiedAlgId = item.id;
      setTimeout(() => (copiedAlgId = null), 1500);
    }
  }
</script>

<!-- Backdrop & Sliding Drawer Wrapper -->
{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300"
    role="dialog"
    aria-modal="true"
    aria-label="Algorithm Sheet"
  >
    <!-- Drawer Panel -->
    <div
      class="w-full sm:w-[480px] lg:w-[540px] h-full frosted-card shadow-2xl flex flex-col overflow-hidden border-l border-black/[0.08] dark:border-white/[0.08] animate-in slide-in-from-right duration-300"
    >
      <!-- Drawer Header -->
      <div class="px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <BookOpen size={16} />
          </div>
          <div>
            <h2 class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Algorithm Sheet</h2>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">CFOP 3x3 algorithms with 3D playback</p>
          </div>
        </div>

        <button
          onclick={onClose}
          class="p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
          aria-label="Close algorithm sheet"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Category Filter Tabs -->
      <div class="px-6 pt-3 pb-2 flex gap-1.5 border-b border-black/[0.04] dark:border-white/[0.06]">
        {#each categories as cat}
          <button
            onclick={() => (activeCategory = cat)}
            class="px-4 py-1.5 rounded-full text-xs font-medium transition-all {activeCategory === cat ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'}"
          >
            {cat}
            <span class="text-[10px] opacity-60 ml-1">({ALGORITHMS.filter((a) => a.category === cat).length})</span>
          </button>
        {/each}
      </div>

      <!-- Algorithms Scrollable Grid -->
      <div class="flex-1 overflow-y-auto p-6 space-y-3">
        {#each filteredAlgs as item (item.id)}
          <div
            onclick={() => selectAlgorithm(item)}
            onkeydown={(e) => { if (e.key === 'Enter') selectAlgorithm(item); }}
            tabindex="0"
            role="button"
            class="p-4 rounded-2xl border transition-all text-left group cursor-pointer {selectedAlg?.id === item.id ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900/[0.03] dark:bg-white/[0.05]' : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 bg-white/40 dark:bg-zinc-900/40'}"
          >
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</span>
                {#if item.probability}
                  <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-zinc-500 font-mono">
                    {item.probability}
                  </span>
                {/if}
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  onclick={(e) => copyAlg(item, e)}
                  class="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
                  title="Copy moves"
                >
                  {#if copiedAlgId === item.id}
                    <Check size={13} class="text-emerald-500" />
                  {:else}
                    <Copy size={13} />
                  {/if}
                </button>
                <div class="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={11} fill="currentColor" />
                  <span>3D</span>
                </div>
              </div>
            </div>

            <!-- Notation -->
            <div class="font-mono text-xs font-normal tracking-wide text-zinc-800 dark:text-zinc-200 py-1 bg-black/[0.02] dark:bg-white/[0.02] px-2.5 rounded-lg">
              {item.alg}
            </div>

            {#if item.description}
              <p class="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">{item.description}</p>
            {/if}
          </div>
        {/each}
      </div>

      <!-- 3D Interactive TwistyPlayer Modal / Sub-drawer -->
      {#if selectedAlg}
        <div
          class="p-5 border-t border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl animate-in slide-in-from-bottom duration-200"
        >
          <div class="flex items-center justify-between pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{selectedAlg.name} 3D Playback</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono">Interactive</span>
            </div>
            <button
              onclick={closeVisualizer}
              class="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="Close visualizer"
            >
              <X size={15} />
            </button>
          </div>

          <!-- Twisty Player Container -->
          <div
            bind:this={twistyContainer}
            class="w-full flex items-center justify-center min-h-[280px] rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 overflow-hidden border border-black/[0.04] dark:border-white/[0.06]"
          >
            {#if !twistyLoaded}
              <div class="text-xs text-zinc-400 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Loading 3D Twisty Engine...
              </div>
            {/if}
          </div>

          <div class="mt-2 text-center">
            <p class="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">{selectedAlg.alg}</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
