<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { fetchAllAlgorithms, resolveCaseImageUrl } from '$lib/api/algorithms';
  import type { ApiAlgorithm } from '$lib/types';
  import {
    Search,
    BookOpen,
    Play,
    Pause,
    Copy,
    Check,
    X,
    Star,
    ArrowLeft,
    RotateCcw,
    SkipBack,
    SkipForward,
    Filter,
    Plus,
    Trash2
  } from 'lucide-svelte';

  interface CaseFormula {
    id: string;
    label: string;
    moves: string;
    moveCount: number;
    isCustom?: boolean;
    customIndex?: number;
  }

  let algorithms = $state<ApiAlgorithm[]>([]);
  let loading = $state(true);
  let searchQuery = $state('');
  let selectedCategory = $state<'all' | 'f2l' | 'pll' | 'oll' | 'mastered'>('all');
  let selectedCaseGroup = $state<string>('all');
  let copiedId = $state<string | null>(null);

  function getBadgeClass(cat: string): string {
    if (cat === 'f2l') return 'badge-f2l';
    if (cat === 'pll') return 'badge-pll';
    return 'badge-oll';
  }

  // Mastery tracking (persisted in localStorage)
  let masteredIds = $state<string[]>([]);

  // Custom algorithms added by user (persisted in localStorage: { [algId]: string[] })
  let customAlgs = $state<Record<string, string[]>>({});

  // 3D Visualizer & Detail Modal State
  let activeAlg = $state<ApiAlgorithm | null>(null);
  let activeModalFormulaIndex = $state<number>(0);
  let newCustomAlgInput = $state<string>('');
  let twistyLoaded = $state(false);
  let twistyContainer = $state<HTMLDivElement | null>(null);
  let twistyPlayerInstance: any = null;
  let isPlaying = $state(false);
  let currentTempo = $state<number>(1.0);

  onMount(async () => {
    algorithms = await fetchAllAlgorithms();
    loading = false;

    if (browser) {
      try {
        const storedMastered = localStorage.getItem('cubelab-mastered-algs');
        if (storedMastered) {
          masteredIds = JSON.parse(storedMastered);
        }
      } catch (e) {}

      try {
        const storedCustom = localStorage.getItem('cubelab-custom-algs');
        if (storedCustom) {
          customAlgs = JSON.parse(storedCustom);
        }
      } catch (e) {}

      try {
        await import('cubing/twisty');
        twistyLoaded = true;
      } catch (err) {
        console.error('Failed to load cubing/twisty:', err);
      }
    }
  });

  function countMoves(moves: string): number {
    if (!moves) return 0;
    const clean = moves.replace(/[\(\)\[\]']/g, ' ').trim();
    return clean.split(/\s+/).filter(Boolean).length;
  }

  // Parse all formulas for a given case: Main + Alternatives from DB + User Custom formulas
  function getCaseFormulas(alg: ApiAlgorithm): CaseFormula[] {
    const list: CaseFormula[] = [];
    if (alg.moves && alg.moves.trim()) {
      list.push({
        id: `${alg.id}-main`,
        label: 'Main',
        moves: alg.moves.trim(),
        moveCount: countMoves(alg.moves)
      });
    }

    if (alg.alternative_moves && alg.alternative_moves.trim()) {
      const parts = alg.alternative_moves.split('|').map((s) => s.trim()).filter(Boolean);
      parts.forEach((alt, idx) => {
        list.push({
          id: `${alg.id}-alt-${idx + 1}`,
          label: parts.length === 1 ? 'Alternative' : `Alternative ${idx + 1}`,
          moves: alt,
          moveCount: countMoves(alt)
        });
      });
    }

    const userCustoms = customAlgs[alg.id] || [];
    userCustoms.forEach((c, idx) => {
      list.push({
        id: `${alg.id}-custom-${idx + 1}`,
        label: `Custom ${idx + 1}`,
        moves: c,
        moveCount: countMoves(c),
        isCustom: true,
        customIndex: idx
      });
    });

    return list;
  }

  function cleanAlgForTwisty(raw: string): string {
    if (!raw) return '';
    let clean = raw.replace(/\[([A-Za-z0-9' ]+)\]/g, '$1');
    clean = clean.replace(/[^A-Za-z0-9'() /]/g, ' ').trim();
    return clean;
  }

  function toggleMastery(id: string, e?: MouseEvent) {
    if (e) e.stopPropagation();
    if (masteredIds.includes(id)) {
      masteredIds = masteredIds.filter((item) => item !== id);
    } else {
      masteredIds = [...masteredIds, id];
    }
    if (browser) {
      try {
        localStorage.setItem('cubelab-mastered-algs', JSON.stringify(masteredIds));
      } catch (e) {}
    }
  }

  function copyText(text: string, id: string, e?: MouseEvent) {
    if (e) e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      copiedId = id;
      setTimeout(() => (copiedId = null), 1500);
    }
  }

  // Mastery stats calculation
  const totalF2l = $derived(algorithms.filter((a) => a.category === 'f2l').length);
  const masteredF2l = $derived(algorithms.filter((a) => a.category === 'f2l' && masteredIds.includes(a.id)).length);
  const totalPll = $derived(algorithms.filter((a) => a.category === 'pll').length);
  const masteredPll = $derived(algorithms.filter((a) => a.category === 'pll' && masteredIds.includes(a.id)).length);
  const totalOll = $derived(algorithms.filter((a) => a.category === 'oll').length);
  const masteredOll = $derived(algorithms.filter((a) => a.category === 'oll' && masteredIds.includes(a.id)).length);

  // Extract unique case groups for secondary filter
  const caseGroups = $derived.by(() => {
    let list = algorithms;
    if (selectedCategory === 'f2l' || selectedCategory === 'pll' || selectedCategory === 'oll') {
      list = algorithms.filter((a) => a.category === selectedCategory);
    } else if (selectedCategory === 'mastered') {
      list = algorithms.filter((a) => masteredIds.includes(a.id));
    }
    const groups = new Set<string>();
    list.forEach((a) => {
      if (a.case_group) groups.add(a.case_group);
    });
    return Array.from(groups);
  });

  // Filtered algorithms list
  const filteredAlgorithms = $derived.by(() => {
    return algorithms.filter((a) => {
      if (selectedCategory === 'f2l' || selectedCategory === 'pll' || selectedCategory === 'oll') {
        if (a.category !== selectedCategory) return false;
      } else if (selectedCategory === 'mastered') {
        if (!masteredIds.includes(a.id)) return false;
      }

      if (selectedCaseGroup !== 'all' && a.case_group !== selectedCaseGroup) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = a.name.toLowerCase().includes(q);
        const matchesCode = a.code.toLowerCase().includes(q);
        const matchesGroup = a.case_group.toLowerCase().includes(q);
        const matchesMoves = a.moves.toLowerCase().includes(q);
        const matchesAlt = a.alternative_moves.toLowerCase().includes(q);
        return matchesName || matchesCode || matchesGroup || matchesMoves || matchesAlt;
      }

      return true;
    });
  });

  // Modal Open & Close
  function openCaseModal(alg: ApiAlgorithm, formulaIndex = 0) {
    activeAlg = alg;
    activeModalFormulaIndex = formulaIndex;
    newCustomAlgInput = '';
    isPlaying = false;
    currentTempo = 1.0;
  }

  function closeCaseModal() {
    if (twistyPlayerInstance) {
      try {
        twistyPlayerInstance.pause();
      } catch (e) {}
    }
    activeAlg = null;
    twistyPlayerInstance = null;
    newCustomAlgInput = '';
  }

  // Active formulas for the currently opened modal
  const modalFormulas = $derived(activeAlg ? getCaseFormulas(activeAlg) : []);
  const activeModalFormula = $derived(
    modalFormulas[activeModalFormulaIndex] || modalFormulas[0] || null
  );

  // Mount or update TwistyPlayer in modal
  // Configured with Yellow on Top (experimental-setup-alg="z2") and anchored to end
  $effect(() => {
    if (twistyLoaded && activeAlg && activeModalFormula && twistyContainer) {
      twistyContainer.innerHTML = '';
      try {
        const player = document.createElement('twisty-player') as any;
        const cleanedAlg = cleanAlgForTwisty(activeModalFormula.moves);

        player.setAttribute('puzzle', '3x3x3');
        player.setAttribute('alg', cleanedAlg);

        // Speedcubing Setup:
        // 1. experimental-setup-alg="z2" brings YELLOW to UP face, matching condition diagrams
        // 2. experimental-setup-anchor="end" starts from scrambled case, solving on play
        player.setAttribute('experimental-setup-alg', 'z2');
        player.setAttribute('setup-alg', 'z2');
        player.experimentalSetupAlg = 'z2';

        player.setAttribute('experimental-setup-anchor', 'end');
        player.setAttribute('setup-anchor', 'end');
        player.experimentalSetupAnchor = 'end';

        player.setAttribute('visualization', '3D');
        player.setAttribute('background', 'none');
        player.setAttribute('control-panel', 'none');
        player.setAttribute('tempo-scale', currentTempo.toString());

        player.style.width = '100%';
        player.style.height = '280px';

        twistyContainer.appendChild(player);
        twistyPlayerInstance = player;

        setTimeout(() => {
          try {
            if (player.timeline) {
              player.timeline.jumpToStart();
            }
          } catch (e) {}
        }, 80);
      } catch (err) {
        console.error('Error mounting twisty-player in modal:', err);
      }
    }
  });

  function handlePlayPause() {
    if (!twistyPlayerInstance) return;
    try {
      if (isPlaying) {
        twistyPlayerInstance.pause();
        isPlaying = false;
      } else {
        twistyPlayerInstance.play();
        isPlaying = true;
      }
    } catch (e) {}
  }

  function handleResetToCase() {
    if (!twistyPlayerInstance) return;
    try {
      twistyPlayerInstance.pause();
      isPlaying = false;
      if (twistyPlayerInstance.timeline) {
        twistyPlayerInstance.timeline.jumpToStart();
      }
    } catch (e) {}
  }

  function handleStep(forward: boolean) {
    if (!twistyPlayerInstance) return;
    try {
      twistyPlayerInstance.pause();
      isPlaying = false;
      if (twistyPlayerInstance.timeline) {
        if (forward) {
          twistyPlayerInstance.timeline.jumpToNextMove();
        } else {
          twistyPlayerInstance.timeline.jumpToPreviousMove();
        }
      }
    } catch (e) {}
  }

  function setSpeed(tempo: number) {
    currentTempo = tempo;
    if (twistyPlayerInstance) {
      try {
        twistyPlayerInstance.tempoScale = tempo;
        twistyPlayerInstance.setAttribute('tempo-scale', tempo.toString());
      } catch (e) {}
    }
  }

  // Play a specific formula from the vertical list in the 3D player
  function playFormulaIn3D(index: number) {
    activeModalFormulaIndex = index;
    isPlaying = false;
    setTimeout(() => {
      if (twistyPlayerInstance) {
        try {
          twistyPlayerInstance.play();
          isPlaying = true;
        } catch (e) {}
      }
    }, 150);
  }

  // Add custom user formula for the active case
  function addCustomFormula() {
    if (!activeAlg) return;
    const trimmed = newCustomAlgInput.trim();
    if (!trimmed) return;

    const current = customAlgs[activeAlg.id] || [];
    customAlgs = {
      ...customAlgs,
      [activeAlg.id]: [...current, trimmed]
    };
    newCustomAlgInput = '';

    if (browser) {
      try {
        localStorage.setItem('cubelab-custom-algs', JSON.stringify(customAlgs));
      } catch (e) {}
    }

    // Switch to the newly added custom formula and play
    setTimeout(() => {
      activeModalFormulaIndex = modalFormulas.length - 1;
    }, 50);
  }

  // Remove a custom user formula
  function deleteCustomFormula(customIndex: number, e: MouseEvent) {
    e.stopPropagation();
    if (!activeAlg) return;

    const current = customAlgs[activeAlg.id] || [];
    const updated = current.filter((_, idx) => idx !== customIndex);
    customAlgs = {
      ...customAlgs,
      [activeAlg.id]: updated
    };

    if (browser) {
      try {
        localStorage.setItem('cubelab-custom-algs', JSON.stringify(customAlgs));
      } catch (e) {}
    }

    if (activeModalFormulaIndex >= modalFormulas.length) {
      activeModalFormulaIndex = 0;
    }
  }
</script>

<svelte:head>
  <title>Algorithm Catalog — cubelab.mascin</title>
</svelte:head>

<div class="min-h-screen flex flex-col px-3 sm:px-8 py-4 sm:py-6 max-w-7xl mx-auto w-full select-none">
  <!-- Top Navigation & Page Title -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-zinc-200/80 dark:border-zinc-800">
    <div class="flex items-center gap-3">
      <a
        href="/"
        class="frosted-card p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex items-center gap-1.5"
        title="Back to Timer"
      >
        <ArrowLeft size={16} strokeWidth={2.2} />
        <span class="text-xs font-semibold hidden sm:inline">Timer</span>
      </a>

      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-lg sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Algorithm Catalog
          </h1>
          <span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            {algorithms.length} cases
          </span>
        </div>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Standard 41 F2L, 57 OLL & 21 PLL cases with multi-formula alternatives, custom notes, and 3D playback.
        </p>
      </div>
    </div>

    <!-- Search Input -->
    <div class="relative w-full md:w-72">
      <Search size={15} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search name, code, or moves..."
        class="w-full pl-9 pr-4 py-2 rounded-xl frosted-card text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all font-sans"
      />
      {#if searchQuery}
        <button
          onclick={() => (searchQuery = '')}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      {/if}
    </div>
  </div>

  <!-- Mastery Progress Tracker -->
  <div class="py-3 sm:py-4 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
    <div class="flex items-center gap-3 sm:gap-5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
      <!-- F2L Progress -->
      <div class="flex flex-col gap-1 min-w-[110px] flex-1 sm:flex-initial">
        <div class="flex items-center justify-between text-xs font-medium">
          <span class="text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span> F2L
          </span>
          <span class="font-mono text-[11px] text-zinc-500">{masteredF2l}/{totalF2l || 41}</span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            class="h-full bg-blue-500 transition-all duration-300"
            style="width: {totalF2l ? (masteredF2l / totalF2l) * 100 : 0}%"
          ></div>
        </div>
      </div>

      <!-- OLL Progress -->
      <div class="flex flex-col gap-1 min-w-[110px] flex-1 sm:flex-initial">
        <div class="flex items-center justify-between text-xs font-medium">
          <span class="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span> OLL
          </span>
          <span class="font-mono text-[11px] text-zinc-500">{masteredOll}/{totalOll || 57}</span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            class="h-full bg-amber-500 transition-all duration-300"
            style="width: {totalOll ? (masteredOll / totalOll) * 100 : 0}%"
          ></div>
        </div>
      </div>

      <!-- PLL Progress -->
      <div class="flex flex-col gap-1 min-w-[110px] flex-1 sm:flex-initial">
        <div class="flex items-center justify-between text-xs font-medium">
          <span class="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> PLL
          </span>
          <span class="font-mono text-[11px] text-zinc-500">{masteredPll}/{totalPll || 21}</span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            class="h-full bg-emerald-500 transition-all duration-300"
            style="width: {totalPll ? (masteredPll / totalPll) * 100 : 0}%"
          ></div>
        </div>
      </div>
    </div>

    <div class="text-[11px] text-zinc-400 self-end sm:self-center hidden sm:block">
      Click <Star size={12} class="inline text-amber-500 fill-amber-500 mx-0.5" /> to mark mastered cases
    </div>
  </div>

  <!-- Filters Row -->
  <div class="py-3 flex flex-wrap items-center justify-between gap-2.5">
    <!-- Category Tabs -->
    <div class="flex items-center gap-1 frosted-pill p-1 rounded-full overflow-x-auto max-w-full">
      <button
        onclick={() => { selectedCategory = 'all'; selectedCaseGroup = 'all'; }}
        class="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 {selectedCategory === 'all' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'}"
      >
        All ({algorithms.length})
      </button>

      <button
        onclick={() => { selectedCategory = 'f2l'; selectedCaseGroup = 'all'; }}
        class="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 {selectedCategory === 'f2l' ? 'bg-blue-600 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-blue-600'}"
      >
        F2L ({algorithms.filter(a => a.category === 'f2l').length})
      </button>

      <button
        onclick={() => { selectedCategory = 'oll'; selectedCaseGroup = 'all'; }}
        class="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 {selectedCategory === 'oll' ? 'bg-amber-600 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600'}"
      >
        OLL ({algorithms.filter(a => a.category === 'oll').length})
      </button>

      <button
        onclick={() => { selectedCategory = 'pll'; selectedCaseGroup = 'all'; }}
        class="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 {selectedCategory === 'pll' ? 'bg-emerald-600 text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600'}"
      >
        PLL ({algorithms.filter(a => a.category === 'pll').length})
      </button>

      <button
        onclick={() => { selectedCategory = 'mastered'; selectedCaseGroup = 'all'; }}
        class="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 {selectedCategory === 'mastered' ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'}"
      >
        ★ ({masteredIds.length})
      </button>
    </div>

    <!-- Case Group Sub-filter Dropdown -->
    {#if caseGroups.length > 0}
      <div class="flex items-center gap-1.5 text-xs ml-auto">
        <span class="text-zinc-400 hidden sm:inline-flex items-center gap-1 font-medium">
          <Filter size={13} /> Group:
        </span>
        <select
          bind:value={selectedCaseGroup}
          class="frosted-card px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer border border-zinc-200/80 dark:border-zinc-800 max-w-[170px] truncate"
        >
          <option value="all">All Groups ({caseGroups.length})</option>
          {#each caseGroups as group}
            <option value={group}>{group}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex-1 flex flex-col items-center justify-center py-20">
      <div class="w-8 h-8 rounded-full border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent animate-spin"></div>
      <p class="mt-4 text-xs font-medium text-zinc-400">Loading algorithms...</p>
    </div>
  {:else if filteredAlgorithms.length === 0}
    <!-- Empty State -->
    <div class="flex-1 flex flex-col items-center justify-center py-24 text-center">
      <div class="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
        <Search size={20} />
      </div>
      <h3 class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No cases matched</h3>
      <p class="text-xs text-zinc-400 mt-1 max-w-sm">No cases found with the current filter or search query.</p>
      <button
        onclick={() => { searchQuery = ''; selectedCategory = 'all'; selectedCaseGroup = 'all'; }}
        class="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
      >
        Reset Filters
      </button>
    </div>
  {:else}
    <!-- Twisty Timer Style Dense Multi-Column Grid (3 columns on mobile, 4-6 on desktop) -->
    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 py-3">
      {#each filteredAlgorithms as alg (alg.id)}
        {@const isMastered = masteredIds.includes(alg.id)}
        {@const formulas = getCaseFormulas(alg)}

        <div
          onclick={() => openCaseModal(alg)}
          onkeydown={(e) => { if (e.key === 'Enter') openCaseModal(alg); }}
          tabindex="0"
          role="button"
          class="frosted-card rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-between text-center cursor-pointer group hover:border-zinc-400 dark:hover:border-zinc-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 select-none relative"
          title="Click to view details and formulas for {alg.name}"
        >
          <!-- Card Header: Code Badge & Star Toggle -->
          <div class="w-full flex items-center justify-between gap-1 mb-1">
            <span class="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-bold {getBadgeClass(alg.category)} truncate">
              {alg.code}
            </span>

            <button
              onclick={(e) => toggleMastery(alg.id, e)}
              class="p-0.5 rounded text-zinc-300 hover:text-amber-500 transition {isMastered ? 'text-amber-500 fill-amber-500' : ''}"
              title={isMastered ? 'Mastered' : 'Mark as Mastered'}
              aria-label="Toggle mastery"
            >
              <Star size={13} fill={isMastered ? 'currentColor' : 'none'} />
            </button>
          </div>

          <!-- 2D Condition Diagram (Square, Clean, Crisp SVG) -->
          <div class="w-full aspect-square max-h-20 sm:max-h-24 p-1 flex items-center justify-center my-0.5">
            {#if alg.image_path}
              <img
                src={resolveCaseImageUrl(alg.image_path)}
                alt="{alg.name}"
                class="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            {/if}
          </div>

          <!-- Card Footer: Name & Formula Count Indicator -->
          <div class="w-full mt-1">
            <div class="text-[11px] sm:text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
              {alg.name}
            </div>
            <div class="text-[9px] sm:text-[10px] font-mono text-zinc-400 truncate mt-0.5">
              {formulas.length} {formulas.length === 1 ? 'formula' : 'formulas'}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Twisty Timer Style Case Detail Modal (Screenshot 4: 3D Playback + Vertical Formulas List) -->
{#if activeAlg && activeModalFormula}
  {@const isModalMastered = masteredIds.includes(activeAlg.id)}

  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-label="{activeAlg.name} Details"
  >
    <div
      class="w-full max-w-xl frosted-card rounded-3xl p-4 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col my-auto max-h-[92vh]"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0">
        <div class="flex items-center gap-2.5 sm:gap-3">
          <!-- 2D Case Condition Thumbnail -->
          <div class="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 flex items-center justify-center border border-zinc-200/60 dark:border-zinc-700 shrink-0">
            {#if activeAlg.image_path}
              <img src={resolveCaseImageUrl(activeAlg.image_path)} alt="case" class="w-full h-full object-contain" />
            {/if}
          </div>

          <div>
            <div class="flex items-center gap-1.5">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider {getBadgeClass(activeAlg.category)}">
                {activeAlg.category.toUpperCase()}
              </span>
              <span class="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{activeAlg.code}</span>
              <span class="text-[10px] text-zinc-400 font-mono">({activeAlg.case_group})</span>
            </div>
            <h2 class="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
              {activeAlg.name}
            </h2>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <!-- Mastery Star Toggle in Modal -->
          <button
            onclick={(e) => toggleMastery(activeAlg!.id, e)}
            class="p-2 rounded-xl text-zinc-400 hover:text-amber-500 transition {isModalMastered ? 'text-amber-500 fill-amber-500' : ''}"
            title={isModalMastered ? 'Mastered' : 'Mark as Mastered'}
            aria-label="Toggle mastery"
          >
            <Star size={18} fill={isModalMastered ? 'currentColor' : 'none'} />
          </button>

          <!-- Close Modal Button -->
          <button
            onclick={closeCaseModal}
            class="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <!-- Scrollable Modal Body -->
      <div class="overflow-y-auto flex-1 pr-0.5 -mr-0.5 space-y-3.5 my-2">
        <!-- 3D Twisty Player Canvas -->
        <div class="relative w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800 overflow-hidden flex flex-col items-center justify-center">
          <!-- Badge explaining Yellow on Top + Case -> Solve mechanics -->
          <div class="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-zinc-900/80 text-white dark:bg-white/90 dark:text-zinc-900 shadow-sm backdrop-blur-sm">
            Yellow on Top • Playing: {activeModalFormula.label}
          </div>

          <div
            bind:this={twistyContainer}
            class="w-full min-h-[260px] sm:min-h-[280px] flex items-center justify-center"
          >
            {#if !twistyLoaded}
              <div class="text-xs text-zinc-400 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                Loading 3D Rubik's engine...
              </div>
            {/if}
          </div>
        </div>

        <!-- 3D Interactive Playback Controls Bar -->
        <div class="p-2.5 sm:p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between gap-2">
          <!-- Step Controls & Play/Pause -->
          <div class="flex items-center gap-1 sm:gap-1.5">
            <button
              onclick={handleResetToCase}
              class="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition"
              title="Reset to Case Position"
            >
              <RotateCcw size={15} />
            </button>

            <button
              onclick={() => handleStep(false)}
              class="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition"
              title="Step Backward"
            >
              <SkipBack size={15} />
            </button>

            <button
              onclick={handlePlayPause}
              class="px-3.5 py-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-1.5 hover:scale-102 active:scale-98 transition shadow-sm"
              title={isPlaying ? 'Pause' : 'Play to Solve'}
            >
              {#if isPlaying}
                <Pause size={13} fill="currentColor" />
                <span>Pause</span>
              {:else}
                <Play size={13} fill="currentColor" />
                <span>Play</span>
              {/if}
            </button>

            <button
              onclick={() => handleStep(true)}
              class="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition"
              title="Step Forward"
            >
              <SkipForward size={15} />
            </button>
          </div>

          <!-- Speed Controls -->
          <div class="flex items-center gap-1 text-xs">
            <span class="text-[10px] text-zinc-400 font-medium mr-0.5 hidden sm:inline">Speed:</span>
            {#each [0.5, 1.0, 1.5] as spd}
              <button
                onclick={() => setSpeed(spd)}
                class="px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition {currentTempo === spd ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}"
              >
                {spd}x
              </button>
            {/each}
          </div>
        </div>

        <!-- Twisty Timer Style Vertical Formulas List (Screenshot 4) -->
        <div class="space-y-2 pt-1">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Formulas & Alternatives ({modalFormulas.length})
            </h3>
            <span class="text-[11px] text-zinc-400">Click Play to animate in 3D</span>
          </div>

          <div class="flex flex-col gap-2">
            {#each modalFormulas as form, fIdx}
              {@const isCurrentLoaded = activeModalFormulaIndex === fIdx}

              <div
                class="rounded-2xl p-3 border transition-all duration-150 flex flex-col gap-2 {isCurrentLoaded ? 'border-blue-500/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs' : 'border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'}"
              >
                <!-- Row Top: Label & Move Count -->
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold {form.isCustom ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}">
                      {form.label}
                    </span>
                    <span class="text-[10px] font-mono text-zinc-400">
                      {form.moveCount} moves
                    </span>
                    {#if isCurrentLoaded}
                      <span class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        Active in 3D
                      </span>
                    {/if}
                  </div>

                  <!-- Actions: Play 3D, Copy, Delete (if custom) -->
                  <div class="flex items-center gap-1">
                    <button
                      onclick={() => playFormulaIn3D(fIdx)}
                      class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition {isCurrentLoaded && isPlaying ? 'bg-blue-600 text-white shadow-xs' : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90'}"
                      title="Play this formula in 3D player"
                    >
                      <Play size={10} fill="currentColor" />
                      <span>Play 3D</span>
                    </button>

                    <button
                      onclick={(e) => copyText(form.moves, form.id, e)}
                      class="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition"
                      title="Copy formula"
                    >
                      {#if copiedId === form.id}
                        <Check size={13} class="text-emerald-600" />
                      {:else}
                        <Copy size={13} />
                      {/if}
                    </button>

                    {#if form.isCustom && form.customIndex !== undefined}
                      <button
                        onclick={(e) => deleteCustomFormula(form.customIndex!, e)}
                        class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title="Delete custom formula"
                      >
                        <Trash2 size={13} />
                      </button>
                    {/if}
                  </div>
                </div>

                <!-- Moves Notation -->
                <div class="font-mono text-xs sm:text-sm font-medium tracking-wide text-zinc-900 dark:text-zinc-100 break-words leading-relaxed pl-0.5">
                  {form.moves}
                </div>
              </div>
            {/each}
          </div>

          <!-- Add Custom Alternative Formula Field -->
          <div class="pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
            <div class="flex items-center gap-2">
              <input
                type="text"
                bind:value={newCustomAlgInput}
                onkeydown={(e) => { if (e.key === 'Enter') addCustomFormula(); }}
                placeholder="Add custom formula (e.g. R U R' U')..."
                class="flex-1 px-3 py-2 rounded-xl frosted-card text-xs font-mono placeholder:font-sans placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
              <button
                onclick={addCustomFormula}
                disabled={!newCustomAlgInput.trim()}
                class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition shrink-0"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            </div>
            <p class="text-[10px] text-zinc-400 mt-1 pl-1">
              Custom formulas are saved locally in your browser and can be tested immediately in 3D.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
