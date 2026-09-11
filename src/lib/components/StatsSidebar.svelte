<script lang="ts">
  import { solveStore } from '$lib/stores/solves.svelte';
  import { formatTimeShort } from '$lib/utils/format';
  import { Trash2, TrendingDown, TrendingUp, X, Trophy, Zap, Target, Clock } from 'lucide-svelte';

  let {
    isZenActive = false,
    isOpen = false,
    onClose
  } = $props<{
    isZenActive?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
  }>();

  const stats = $derived(solveStore.stats);
  const solves = $derived(solveStore.solves);
</script>

<!-- Desktop Sidebar & Mobile Drawer Wrapper -->
<aside
  class="flex flex-col h-full transition-all duration-300 select-none {isZenActive ? 'opacity-0 pointer-events-none -translate-x-4' : 'opacity-100 translate-x-0'} {isOpen ? 'fixed inset-0 z-50 p-4 bg-black/40 backdrop-blur-sm md:static md:p-0 md:bg-transparent md:backdrop-blur-none' : 'hidden md:flex'}"
>
  <div class="w-full md:w-72 lg:w-80 h-full flex flex-col frosted-card md:rounded-3xl p-5 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between pb-3.5 border-b border-zinc-200/80 dark:border-zinc-800">
      <div class="flex items-baseline gap-2">
        <h2 class="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Session Stats</h2>
        <span class="text-xs font-mono font-medium text-zinc-400">({stats.count} solves)</span>
      </div>

      <div class="flex items-center gap-1">
        {#if solves.length > 0}
          <button
            onclick={() => {
              if (confirm('Clear all solves for this session?')) {
                solveStore.clearSession();
              }
            }}
            class="text-[11px] text-zinc-400 hover:text-rose-600 transition px-2 py-0.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
            title="Clear session"
          >
            Clear
          </button>
        {/if}

        {#if isOpen && onClose}
          <button
            onclick={onClose}
            class="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label="Close stats"
          >
            <X size={16} />
          </button>
        {/if}
      </div>
    </div>

    <!-- Stat Cards Grid (Curated Speedcube Colors, Clean Apple Borders) -->
    <div class="grid grid-cols-2 gap-2.5 py-4">
      <!-- Best Single (Emerald) -->
      <div class="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
            <Trophy size={11} class="text-emerald-500" /> Best
          </span>
        </div>
        <div class="text-lg font-mono font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5">
          {formatTimeShort(stats.best)}
        </div>
      </div>

      <!-- Session Mean (Cyan/Sky) -->
      <div class="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
            <Target size={11} class="text-sky-500" /> Mean
          </span>
        </div>
        <div class="text-lg font-mono font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
          {formatTimeShort(stats.mean)}
        </div>
      </div>

      <!-- Current Ao5 (Blue) -->
      <div class="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
            <Zap size={11} class="text-blue-500" /> Ao5
          </span>
          {#if stats.bestAo5 && stats.currentAo5 && stats.currentAo5 <= stats.bestAo5}
            <span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono font-bold">PB</span>
          {/if}
        </div>
        <div class="text-lg font-mono font-bold tracking-tight text-blue-600 dark:text-blue-400 mt-0.5">
          {formatTimeShort(stats.currentAo5)}
        </div>
        <div class="text-[10px] font-mono text-zinc-400 mt-0.5 truncate">Best: {formatTimeShort(stats.bestAo5)}</div>
      </div>

      <!-- Current Ao12 (Violet) -->
      <div class="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
            <Clock size={11} class="text-violet-500" /> Ao12
          </span>
          {#if stats.bestAo12 && stats.currentAo12 && stats.currentAo12 <= stats.bestAo12}
            <span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono font-bold">PB</span>
          {/if}
        </div>
        <div class="text-lg font-mono font-bold tracking-tight text-violet-600 dark:text-violet-400 mt-0.5">
          {formatTimeShort(stats.currentAo12)}
        </div>
        <div class="text-[10px] font-mono text-zinc-400 mt-0.5 truncate">Best: {formatTimeShort(stats.bestAo12)}</div>
      </div>
    </div>

    <!-- Recent Solves List -->
    <div class="flex-1 flex flex-col min-h-0 pt-1">
      <div class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Recent Solves</div>

      {#if solves.length === 0}
        <div class="flex-1 flex items-center justify-center text-center p-6 text-zinc-400 text-xs">
          No solves yet.<br />Hold spacebar or touch to record your first solve!
        </div>
      {:else}
        <div class="flex-1 overflow-y-auto pr-1 space-y-1.5">
          {#each solves as solve, index (solve.id)}
            {@const num = solves.length - index}
            {@const prevSolve = solves[index + 1]}
            {@const diff = prevSolve ? solve.timeMs - prevSolve.timeMs : null}
            <div
              class="group flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-colors text-xs font-mono"
            >
              <div class="flex items-center gap-2.5">
                <span class="text-zinc-400 w-5 text-right">{num}.</span>
                <span class="font-semibold text-zinc-900 dark:text-zinc-100">
                  {#if solve.penalty === 'DNF'}
                    <span class="text-rose-600 font-bold">DNF</span>
                  {:else}
                    {formatTimeShort(solve.timeMs)}
                    {#if solve.penalty === '+2'}
                      <span class="text-amber-600 font-bold ml-0.5">+2</span>
                    {/if}
                  {/if}
                </span>
                {#if diff !== null}
                  <span class="text-[10px] font-medium flex items-center gap-0.5 px-1.5 py-0.2 rounded {diff < 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}">
                    {#if diff < 0}
                      <TrendingDown size={11} />
                    {:else}
                      <TrendingUp size={11} />
                    {/if}
                    {Math.abs(diff / 1000).toFixed(1)}s
                  </span>
                {/if}
              </div>

              <!-- Delete Solve on Hover -->
              <button
                onclick={() => solveStore.deleteSolve(solve.id)}
                class="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 transition-opacity"
                title="Delete solve"
                aria-label="Delete solve {num}"
              >
                <Trash2 size={13} />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</aside>
