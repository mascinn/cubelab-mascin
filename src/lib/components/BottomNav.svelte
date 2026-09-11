<script lang="ts">
  import { page } from '$app/stores';
  import { Timer, BarChart3, BookOpen } from 'lucide-svelte';

  export type ActiveTab = 'timer' | 'solves' | 'algorithms';

  let {
    activeTab = 'timer',
    isZenActive = false,
    onSelectTab
  } = $props<{
    activeTab?: ActiveTab;
    isZenActive?: boolean;
    onSelectTab?: (tab: ActiveTab) => void;
  }>();

  const isTimerPage = $derived($page.url.pathname === '/');
  const isAlgoPage = $derived($page.url.pathname === '/algorithms');
</script>

<!-- Mobile Floating Pill Navigation Dock -->
<div
  class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 {isZenActive ? 'opacity-0 pointer-events-none translate-y-8' : 'opacity-100 translate-y-0'}"
>
  <nav
    class="frosted-pill rounded-full p-1.5 flex items-center gap-1 shadow-[0_12px_36px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
    aria-label="Mobile Navigation Dock"
  >
    <!-- Timer Tab -->
    <a
      href="/"
      onclick={() => onSelectTab && onSelectTab('timer')}
      class="relative px-3.5 py-2 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer {isTimerPage && activeTab !== 'solves' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}"
    >
      <Timer size={15} strokeWidth={2.2} />
      <span>Timer</span>
    </a>

    <!-- Solves Drawer Trigger (only on timer page) -->
    {#if isTimerPage}
      <button
        onclick={() => onSelectTab && onSelectTab('solves')}
        class="relative px-3.5 py-2 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer {activeTab === 'solves' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}"
      >
        <BarChart3 size={15} strokeWidth={2} />
        <span>Solves</span>
      </button>
    {/if}

    <!-- Algorithms Catalog Tab -->
    <a
      href="/algorithms"
      onclick={() => onSelectTab && onSelectTab('algorithms')}
      class="relative px-3.5 py-2 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer {isAlgoPage ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}"
    >
      <BookOpen size={15} strokeWidth={2} />
      <span>Algorithms</span>
    </a>
  </nav>
</div>
