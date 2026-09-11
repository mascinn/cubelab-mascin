<script lang="ts">
  import Timer from '$lib/components/Timer.svelte';
  import StatsSidebar from '$lib/components/StatsSidebar.svelte';
  import { zen } from '$lib/stores/zen.svelte';
  import { solveStore } from '$lib/stores/solves.svelte';
  import { BarChart3 } from 'lucide-svelte';
  import type { TimerState, Solve } from '$lib/types';

  let timerState = $state<TimerState>('idle');
  let mobileStatsOpen = $state(false);

  function handleStateChange(state: TimerState, isZen: boolean) {
    timerState = state;
    zen.set(isZen);
  }

  function handleSolveCompleted(solve: Solve) {
    // Solve tracked by solveStore
  }
</script>

<svelte:head>
  <title>Timer — cubelab.mascin</title>
</svelte:head>

<div class="relative flex-1 flex flex-col h-full overflow-hidden">
  <!-- Main 3-Column / Responsive Hero Viewport -->
  <main class="flex-1 flex max-w-[1600px] w-full mx-auto p-3 sm:p-6 md:p-8 gap-6 md:gap-8 overflow-hidden">
    <!-- Left Column: Session Stats & Solves Sidebar -->
    <StatsSidebar
      isZenActive={zen.active}
      isOpen={mobileStatsOpen}
      onClose={() => (mobileStatsOpen = false)}
    />

    <!-- Center Column: Core Responsive Timer Hero -->
    <section class="flex-1 flex flex-col relative h-full min-h-[500px]">
      <Timer
        onStateChange={handleStateChange}
        onSolveCompleted={handleSolveCompleted}
      />
    </section>
  </main>

  <!-- Clean Floating Mobile Stats Button (Only on Timer page, disappears in Zen Mode) -->
  {#if !zen.active}
    <div class="md:hidden fixed bottom-6 left-6 z-30 transition-all duration-300">
      <button
        onclick={() => (mobileStatsOpen = true)}
        class="frosted-pill px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-md border border-zinc-200/80 dark:border-zinc-800"
      >
        <BarChart3 size={15} />
        <span>Solves ({solveStore.solves.length})</span>
      </button>
    </div>
  {/if}
</div>
