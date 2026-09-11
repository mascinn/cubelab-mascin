<script lang="ts">
  import { page } from '$app/stores';
  import { theme } from '$lib/stores/theme.svelte';
  import { solveStore } from '$lib/stores/solves.svelte';
  import type { PuzzleType } from '$lib/types';
  import { Sun, Moon, Box, ChevronDown, BookOpen, BarChart3, Timer } from 'lucide-svelte';

  let {
    isZenActive = false,
    onToggleAlgoDrawer,
    onToggleStatsSidebar
  } = $props<{
    isZenActive?: boolean;
    onToggleAlgoDrawer?: () => void;
    onToggleStatsSidebar?: () => void;
  }>();

  let puzzleMenuOpen = $state(false);
  const puzzles: PuzzleType[] = ['3x3x3', '2x2x2', '4x4x4', '3x3 OH'];

  function selectPuzzle(p: PuzzleType) {
    solveStore.setPuzzle(p);
    puzzleMenuOpen = false;
  }

  const isTimerPage = $derived($page.url.pathname === '/');
  const isAlgoPage = $derived($page.url.pathname === '/algorithms');
</script>

<!-- Floating Frosted Header -->
<header
  id="main-header"
  class="sticky top-0 z-40 w-full px-4 sm:px-8 py-3 flex items-center justify-between transition-all duration-300 select-none {isZenActive ? 'opacity-0 pointer-events-none -translate-y-3' : 'opacity-100'}"
>
  <!-- Left: Branding (Clean Apple Style, No AI Gradients) -->
  <a href="/" class="flex items-center gap-2.5 group">
    <div class="w-8 h-8 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
      <Box size={16} strokeWidth={2.4} class="text-white dark:text-zinc-950" />
    </div>
    <div class="flex flex-col">
      <span class="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
        cubelab<span class="text-zinc-400 dark:text-zinc-500 font-normal">.mascin</span>
      </span>
    </div>
  </a>

  <!-- Center: Primary View Switcher Pill [Timer | Algorithms] -->
  <nav class="frosted-pill rounded-full p-1 flex items-center gap-1">
    <a
      href="/"
      class="px-2.5 sm:px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all {isTimerPage ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'}"
      title="Timer View"
      aria-label="Timer View"
    >
      <Timer size={14} strokeWidth={2.2} />
      <span class="hidden sm:inline">Timer</span>
    </a>

    <a
      href="/algorithms"
      class="px-2.5 sm:px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all {isAlgoPage ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'}"
      title="Algorithms View"
      aria-label="Algorithms View"
    >
      <BookOpen size={14} strokeWidth={2.2} />
      <span class="hidden sm:inline">Algorithms</span>
    </a>
  </nav>

  <!-- Right: Puzzle Selector & Theme Toggle -->
  <div class="flex items-center gap-2">
    <!-- Puzzle Selector Pill -->
    <div class="relative hidden sm:block">
      <button
        onclick={() => (puzzleMenuOpen = !puzzleMenuOpen)}
        class="frosted-pill rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-black/20 dark:hover:border-white/20 transition-all cursor-pointer"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></span>
        <span>{solveStore.puzzle}</span>
        <ChevronDown size={12} class="opacity-60 transition-transform duration-200 {puzzleMenuOpen ? 'rotate-180' : ''}" />
      </button>

      {#if puzzleMenuOpen}
        <div
          class="absolute right-0 top-full mt-2 w-32 frosted-card rounded-2xl p-1.5 shadow-xl z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {#each puzzles as p}
            <button
              onclick={() => selectPuzzle(p)}
              class="w-full text-left px-3 py-1.5 text-xs font-medium rounded-xl transition-colors flex items-center justify-between {solveStore.puzzle === p ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'}"
            >
              <span>{p}</span>
              {#if solveStore.puzzle === p}
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Mobile Solves Drawer Toggle (only on timer page) -->
    {#if isTimerPage && onToggleStatsSidebar}
      <button
        onclick={onToggleStatsSidebar}
        class="md:hidden frosted-card w-9 h-9 rounded-full flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all"
        title="Session Solves"
      >
        <BarChart3 size={16} strokeWidth={2} />
      </button>
    {/if}

    <!-- Theme Toggle (Clean Apple Style) -->
    <button
      onclick={() => theme.toggle()}
      class="frosted-card w-9 h-9 rounded-full flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
      aria-label="Toggle dark/light mode"
    >
      {#if theme.dark}
        <Sun size={16} strokeWidth={2} class="rotate-0 transition-transform duration-300 text-amber-400" />
      {:else}
        <Moon size={16} strokeWidth={2} class="-rotate-12 transition-transform duration-300 text-zinc-700" />
      {/if}
    </button>
  </div>
</header>
