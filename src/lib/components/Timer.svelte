<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { solveStore } from '$lib/stores/solves.svelte';
  import { generateScramble } from '$lib/utils/scramble';
  import { formatTimeParts } from '$lib/utils/format';
  import type { TimerState, Solve } from '$lib/types';
  import { RefreshCw, Copy, Check, Trash2, Volume2, VolumeX, Keyboard, Eye, TimerReset } from 'lucide-svelte';
  import ScramblePreview from '$lib/components/ScramblePreview.svelte';

  let {
    onStateChange,
    onSolveCompleted
  } = $props<{
    onStateChange?: (state: TimerState, isZen: boolean) => void;
    onSolveCompleted?: (solve: Solve) => void;
  }>();

  // State runes
  let timerStatus = $state<TimerState>('idle');
  let startTime = $state<number>(0);
  let elapsed = $state<number>(0);
  let currentScramble = $state<string>(generateScramble());
  let copied = $state<boolean>(false);
  let lastRecordedSolve = $state<Solve | null>(null);
  let soundEnabled = $state<boolean>(true);
  let isScramblePreviewOpen = $state<boolean>(false);

  // WCA 15s Inspection state
  let inspectionEnabled = $state<boolean>(false);
  let inspectionStartTime = $state<number>(0);
  let inspectionElapsed = $state<number>(0);
  let inspectionFrameId: number | null = null;
  let hasAlerted8s = false;
  let hasAlerted12s = false;
  let pendingPenalty = $state<'none' | '+2' | 'DNF'>('none');

  // Restore states from localStorage
  if (browser) {
    try {
      const savedPreview = localStorage.getItem('cubelab-preview-open');
      isScramblePreviewOpen = savedPreview !== null ? savedPreview === 'true' : true;
    } catch (e) {
      isScramblePreviewOpen = true;
    }

    try {
      const savedInsp = localStorage.getItem('cubelab-inspection-enabled');
      inspectionEnabled = savedInsp === 'true';
    } catch (e) {}
  }

  function toggleScramblePreview() {
    isScramblePreviewOpen = !isScramblePreviewOpen;
    if (browser) {
      try {
        localStorage.setItem('cubelab-preview-open', String(isScramblePreviewOpen));
      } catch (e) {}
    }
  }

  function toggleInspection() {
    if (timerStatus === 'inspecting') {
      cancelInspection();
    }
    inspectionEnabled = !inspectionEnabled;
    if (browser) {
      try {
        localStorage.setItem('cubelab-inspection-enabled', String(inspectionEnabled));
      } catch (e) {}
    }
  }

  let animationFrameId: number | null = null;
  let holdTimer: ReturnType<typeof setTimeout> | null = null;
  let audioContext: AudioContext | null = null;

  // WCA 300ms hold threshold
  const HOLD_THRESHOLD_MS = 300;

  // Web Audio click generator for tactile feedback
  function playBeep(freq = 800, duration = 0.04) {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + duration);
    } catch (e) {}
  }

  // Haptic feedback trigger
  function triggerHaptic(durationMs = 15) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(durationMs);
      } catch (e) {}
    }
  }

  // Refresh scramble
  function refreshScramble() {
    currentScramble = generateScramble();
  }

  function copyScramble() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentScramble);
      copied = true;
      setTimeout(() => (copied = false), 1600);
    }
  }

  // WCA 15-second inspection timer methods
  function startInspection() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (inspectionFrameId) {
      cancelAnimationFrame(inspectionFrameId);
      inspectionFrameId = null;
    }

    timerStatus = 'inspecting';
    inspectionStartTime = performance.now();
    inspectionElapsed = 0;
    hasAlerted8s = false;
    hasAlerted12s = false;
    pendingPenalty = 'none';
    notifyState();

    const tick = () => {
      if (timerStatus !== 'inspecting' && timerStatus !== 'holding' && timerStatus !== 'ready') {
        return;
      }
      inspectionElapsed = performance.now() - inspectionStartTime;

      // 8s alert (7 seconds remaining)
      if (inspectionElapsed >= 8000 && !hasAlerted8s) {
        hasAlerted8s = true;
        playBeep(660, 0.08);
        triggerHaptic(20);
      }

      // 12s critical alert (3 seconds remaining)
      if (inspectionElapsed >= 12000 && !hasAlerted12s) {
        hasAlerted12s = true;
        playBeep(880, 0.12);
        triggerHaptic(35);
      }

      inspectionFrameId = requestAnimationFrame(tick);
    };
    inspectionFrameId = requestAnimationFrame(tick);
  }

  function cancelInspection() {
    if (inspectionFrameId) {
      cancelAnimationFrame(inspectionFrameId);
      inspectionFrameId = null;
    }
    inspectionStartTime = 0;
    inspectionElapsed = 0;
    pendingPenalty = 'none';
    timerStatus = 'idle';
    notifyState();
  }

  // Timing State Machine
  function handleHoldStart() {
    if (timerStatus === 'running') {
      stopTimer();
      return;
    }

    // When in inspection: holding starts prepare-to-solve
    if (timerStatus === 'inspecting') {
      timerStatus = 'holding';
      notifyState();

      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (timerStatus === 'holding') {
          timerStatus = 'ready';
          triggerHaptic(18);
          playBeep(880, 0.05); // High crisp ready beep
          notifyState();
        }
      }, HOLD_THRESHOLD_MS);
      return;
    }

    // When idle or stopped
    if (timerStatus !== 'idle' && timerStatus !== 'stopped') return;

    // If WCA inspection is enabled, clicking/holding triggers 15s inspection countdown
    if (inspectionEnabled) {
      startInspection();
      return;
    }

    timerStatus = 'holding';
    elapsed = 0;
    lastRecordedSolve = null;
    notifyState();

    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      if (timerStatus === 'holding') {
        timerStatus = 'ready';
        triggerHaptic(18);
        playBeep(880, 0.05); // High crisp ready beep
        notifyState();
      }
    }, HOLD_THRESHOLD_MS);
  }

  function handleHoldEnd() {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }

    if (timerStatus === 'ready') {
      startTimer();
    } else if (timerStatus === 'holding') {
      // Released before 300ms threshold
      if (inspectionStartTime > 0) {
        // Return to inspection mode
        timerStatus = 'inspecting';
      } else {
        timerStatus = 'idle';
      }
      notifyState();
    }
  }

  function startTimer() {
    if (inspectionFrameId) {
      cancelAnimationFrame(inspectionFrameId);
      inspectionFrameId = null;
    }

    // Determine WCA Inspection Penalty (+2 or DNF)
    if (inspectionEnabled && inspectionStartTime > 0) {
      if (inspectionElapsed >= 17000) {
        pendingPenalty = 'DNF';
      } else if (inspectionElapsed >= 15000) {
        pendingPenalty = '+2';
      } else {
        pendingPenalty = 'none';
      }
    } else {
      pendingPenalty = 'none';
    }

    inspectionStartTime = 0;
    timerStatus = 'running';
    startTime = performance.now();
    notifyState();

    const tick = () => {
      elapsed = performance.now() - startTime;
      animationFrameId = requestAnimationFrame(tick);
    };
    animationFrameId = requestAnimationFrame(tick);
  }

  function stopTimer() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    const finalTime = Math.round(performance.now() - startTime);
    elapsed = finalTime;
    timerStatus = 'stopped';
    triggerHaptic(25);
    playBeep(520, 0.06); // Stop feedback click

    // Record solve with any inspection penalty applied
    const recorded = solveStore.addSolve(finalTime, currentScramble);
    if (pendingPenalty !== 'none') {
      solveStore.setPenalty(recorded.id, pendingPenalty);
      recorded.penalty = pendingPenalty;
    }
    lastRecordedSolve = recorded;
    pendingPenalty = 'none';
    notifyState();

    if (onSolveCompleted) {
      onSolveCompleted(recorded);
    }

    // Prepare next scramble
    setTimeout(() => {
      currentScramble = generateScramble();
    }, 350);
  }

  function notifyState() {
    const isZen = timerStatus === 'inspecting' || timerStatus === 'holding' || timerStatus === 'ready' || timerStatus === 'running';
    if (onStateChange) {
      onStateChange(timerStatus, isZen);
    }
  }

  // Keyboard Event Handlers (Speedcubing shortcuts)
  function onKeyDown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.code === 'Space') {
      if (e.repeat) return;
      e.preventDefault();
      handleHoldStart();
      return;
    }

    if (e.key === 'Escape') {
      if (timerStatus === 'inspecting') {
        cancelInspection();
        return;
      }
    }

    // Quick shortcuts when stopped
    if (timerStatus === 'stopped' || timerStatus === 'idle') {
      if (e.key === '2') {
        togglePenalty('+2');
      } else if (e.key.toLowerCase() === 'd') {
        togglePenalty('DNF');
      } else if (e.key === 'Delete' || e.key === 'Backspace' || e.key.toLowerCase() === 'x') {
        deleteCurrentSolve();
      } else if (e.key.toLowerCase() === 'r') {
        refreshScramble();
      } else if (e.key.toLowerCase() === 'p') {
        toggleScramblePreview();
      } else if (e.key.toLowerCase() === 'i') {
        toggleInspection();
      }
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.code !== 'Space') return;
    e.preventDefault();
    handleHoldEnd();
  }

  // Penalty helpers on current stopped solve
  function togglePenalty(pen: '+2' | 'DNF') {
    if (!lastRecordedSolve) return;
    const nextPen = lastRecordedSolve.penalty === pen ? 'none' : pen;
    solveStore.setPenalty(lastRecordedSolve.id, nextPen);
    lastRecordedSolve = { ...lastRecordedSolve, penalty: nextPen };
  }

  function deleteCurrentSolve() {
    if (!lastRecordedSolve) return;
    solveStore.deleteSolve(lastRecordedSolve.id);
    lastRecordedSolve = null;
  }

  onMount(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    }
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (inspectionFrameId) cancelAnimationFrame(inspectionFrameId);
    if (holdTimer) clearTimeout(holdTimer);
  });

  // Derived display parts
  const penalty = $derived(lastRecordedSolve?.penalty ?? 'none');
  const timeParts = $derived(formatTimeParts(elapsed, penalty));
  const isZenActive = $derived(timerStatus === 'inspecting' || timerStatus === 'holding' || timerStatus === 'ready' || timerStatus === 'running');

  // Derived inspection countdown display
  const inspectionDisplay = $derived.by(() => {
    if (timerStatus !== 'inspecting' && timerStatus !== 'holding' && timerStatus !== 'ready') {
      return { text: '', type: 'normal' as 'normal' | 'warning-8s' | 'critical-12s' | '+2' | 'DNF' };
    }

    if (inspectionElapsed >= 17000) {
      return { text: 'DNF', type: 'DNF' as const };
    }
    if (inspectionElapsed >= 15000) {
      return { text: '+2', type: '+2' as const };
    }

    const remaining = Math.max(0, Math.ceil((15000 - inspectionElapsed) / 1000));
    let type: 'normal' | 'warning-8s' | 'critical-12s' = 'normal';
    if (remaining <= 3) {
      type = 'critical-12s';
    } else if (remaining <= 7) {
      type = 'warning-8s';
    }

    return { text: String(remaining), type };
  });
</script>

<!-- Main Container & Touch Surface -->
<div
  class="relative flex-1 w-full h-full flex flex-col items-center justify-center select-none touch-timer-area px-4 sm:px-8"
  onpointerdown={(e) => {
    if ((e.target as HTMLElement).closest('button, a, [role="button"], input, textarea')) return;
    handleHoldStart();
  }}
  onpointerup={(e) => {
    if ((e.target as HTMLElement).closest('button, a, [role="button"], input, textarea')) return;
    handleHoldEnd();
  }}
  role="region"
  aria-label="Speedcubing Timer Touch Surface"
>
  <!-- Scramble Hero Card (Smooth Zen Mode Fade Out) -->
  <div
    class="absolute top-4 sm:top-8 max-w-2xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 frosted-card rounded-2xl p-3 sm:px-5 sm:py-3 transition-all duration-300 select-none {isZenActive ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}"
  >
    <div class="flex-1 text-center font-mono text-xs sm:text-sm md:text-base font-normal tracking-wide text-zinc-800 dark:text-zinc-200 leading-relaxed px-1 sm:px-2">
      {currentScramble}
    </div>

    <!-- Scramble Actions -->
    <div class="flex items-center justify-center gap-1 sm:gap-1.5 w-full sm:w-auto pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3">
      <!-- Draw Scramble / Preview Button -->
      <button
        onclick={toggleScramblePreview}
        class="p-1.5 rounded-lg transition {isScramblePreviewOpen ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/50' : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
        title="Draw Scramble Preview (P)"
        aria-label="Draw Scramble Preview"
      >
        <Eye size={14} />
      </button>

      <button
        onclick={copyScramble}
        class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        title="Copy scramble"
        aria-label="Copy scramble to clipboard"
      >
        {#if copied}
          <Check size={14} class="text-emerald-600" />
        {:else}
          <Copy size={14} />
        {/if}
      </button>

      <button
        onclick={refreshScramble}
        class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        title="Generate new scramble (R)"
        aria-label="Generate new scramble"
      >
        <RefreshCw size={14} />
      </button>

      <!-- Sound Toggle Button -->
      <button
        onclick={() => (soundEnabled = !soundEnabled)}
        class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        title={soundEnabled ? 'Mute Audio Clicks' : 'Enable Audio Clicks'}
        aria-label="Toggle sound"
      >
        {#if soundEnabled}
          <Volume2 size={14} class="text-blue-600 dark:text-blue-400" />
        {:else}
          <VolumeX size={14} />
        {/if}
      </button>

      <div class="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800 my-auto mx-0.5"></div>

      <!-- WCA 15s Inspection Mode Sleek Mini-Pill -->
      <button
        onclick={toggleInspection}
        class="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer {inspectionEnabled ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-semibold shadow-xs' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
        title="Toggle WCA 15-second inspection mode (I)"
        aria-label="Toggle WCA 15-second inspection mode"
      >
        <TimerReset size={12} />
        <span>15s</span>
        {#if inspectionEnabled}
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Scramble Preview (2D Net & 3D Interactive) -->
  <ScramblePreview
    scramble={currentScramble}
    isZenActive={isZenActive}
    isOpen={isScramblePreviewOpen}
    onClose={() => (isScramblePreviewOpen = false)}
  />

  <!-- Central Responsive Timer Display -->
  <div class="flex flex-col items-center justify-center my-auto transition-transform duration-300">
    <div
      class="font-mono font-light tracking-tight tabular-nums transition-colors duration-150 flex items-baseline select-none"
      class:text-zinc-950={timerStatus === 'idle' || timerStatus === 'stopped'}
      class:dark:text-white={timerStatus === 'idle' || timerStatus === 'stopped'}
      class:text-amber-500={timerStatus === 'holding'}
      class:dark:text-amber-400={timerStatus === 'holding'}
      class:text-emerald-500={timerStatus === 'ready'}
      class:dark:text-emerald-400={timerStatus === 'ready'}
      class:text-zinc-800={timerStatus === 'running'}
      class:dark:text-zinc-100={timerStatus === 'running'}
    >
      {#if timerStatus === 'inspecting'}
        <span
          class="text-8xl sm:text-9xl md:text-[10.5rem] lg:text-[12rem] leading-none font-bold"
          class:text-zinc-950={inspectionDisplay.type === 'normal'}
          class:dark:text-white={inspectionDisplay.type === 'normal'}
          class:text-amber-500={inspectionDisplay.type === 'warning-8s'}
          class:dark:text-amber-400={inspectionDisplay.type === 'warning-8s'}
          class:text-rose-500={inspectionDisplay.type === 'critical-12s'}
          class:dark:text-rose-400={inspectionDisplay.type === 'critical-12s'}
          class:text-rose-600={inspectionDisplay.type === '+2' || inspectionDisplay.type === 'DNF'}
        >
          {inspectionDisplay.text}
        </span>
      {:else if timeParts.main === 'DNF'}
        <span class="text-7xl sm:text-8xl md:text-9xl lg:text-[10.5rem] leading-none text-rose-600 font-bold">
          DNF
        </span>
      {:else}
        <span class="text-7xl sm:text-8xl md:text-9xl lg:text-[10.5rem] leading-none">
          {timeParts.main}
        </span>
        <span class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl opacity-80 leading-none">
          {timeParts.decimals}
        </span>
      {/if}
    </div>

    <!-- State Indicator Badge / Instruction -->
    <div
      class="mt-6 flex items-center gap-2.5 text-xs font-medium tracking-wide uppercase transition-all duration-300 select-none {timerStatus === 'running' || timerStatus === 'inspecting' ? 'opacity-0' : 'opacity-100'}"
    >
      {#if timerStatus === 'inspecting'}
        <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
        <span class="text-amber-600 dark:text-amber-400 font-mono tracking-wider font-semibold">
          {#if inspectionDisplay.type === 'DNF'}
            OVERTIME: DNF PENALTY (HOLD SPACE TO SOLVE)
          {:else if inspectionDisplay.type === '+2'}
            OVERTIME: +2 PENALTY (HOLD SPACE TO SOLVE)
          {:else}
            WCA INSPECTION — HOLD SPACE OR TOUCH TO SOLVE
          {/if}
        </span>
      {:else if timerStatus === 'holding'}
        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        <span class="text-amber-600 dark:text-amber-400 font-mono tracking-wider font-semibold">HOLD FOR GREEN...</span>
      {:else if timerStatus === 'ready'}
        <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
        <span class="text-emerald-600 dark:text-emerald-400 font-mono tracking-wider font-bold">RELEASE TO START</span>
      {:else if timerStatus === 'stopped'}
        <!-- Post-solve Quick Penalty & Inspection toolbar -->
        <div class="flex items-center gap-2">
          {#if lastRecordedSolve}
            <button
              onclick={() => togglePenalty('+2')}
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition {lastRecordedSolve.penalty === '+2' ? 'bg-amber-500 text-white' : 'frosted-card text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}"
              title="Shortcut: 2"
            >
              +2
            </button>
            <button
              onclick={() => togglePenalty('DNF')}
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition {lastRecordedSolve.penalty === 'DNF' ? 'bg-rose-600 text-white' : 'frosted-card text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}"
              title="Shortcut: D"
            >
              DNF
            </button>
            <button
              onclick={deleteCurrentSolve}
              class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              title="Discard solve (Del)"
            >
              <Trash2 size={14} />
            </button>
          {/if}
          <span class="text-zinc-400 text-xs normal-case ml-2">Press Space or Touch to solve again</span>
        </div>
      {:else}
        {#if inspectionEnabled}
          <span class="text-zinc-400 normal-case tracking-normal">Press Space or Touch to start 15s inspection</span>
        {:else}
          <span class="text-zinc-400 normal-case tracking-normal">Hold Space or Touch screen</span>
        {/if}
      {/if}
    </div>
  </div>

  <!-- Keyboard Shortcuts Quick Helper (Bottom) -->
  <div
    class="absolute bottom-4 sm:bottom-6 text-[11px] text-zinc-400 flex items-center gap-3 transition-opacity duration-300 {isZenActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}"
  >
    <span class="hidden sm:inline-flex items-center gap-1 font-mono">
      <kbd class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">Space</kbd> Start/Stop
    </span>
    <span class="hidden sm:inline-flex items-center gap-1 font-mono">
      <kbd class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">2</kbd> +2
    </span>
    <span class="hidden sm:inline-flex items-center gap-1 font-mono">
      <kbd class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">D</kbd> DNF
    </span>
    <span class="hidden sm:inline-flex items-center gap-1 font-mono">
      <kbd class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">Del</kbd> Discard
    </span>
    <span class="hidden sm:inline-flex items-center gap-1 font-mono">
      <kbd class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">R</kbd> Scramble
    </span>
    <span class="hidden sm:inline-flex items-center gap-1 font-mono">
      <kbd class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">P</kbd> Preview
    </span>
    <span class="hidden sm:inline-flex items-center gap-1 font-mono">
      <kbd class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">I</kbd> Inspection
    </span>
  </div>
</div>
