import { browser } from '$app/environment';
import type { Solve, SessionStats, PuzzleType } from '$lib/types';

function calculateTrimmedMean(times: number[]): number | null {
  if (times.length < 3) return null;
  const sorted = [...times].sort((a, b) => a - b);
  // Trim 1 fastest and 1 slowest
  const trimmed = sorted.slice(1, -1);
  const sum = trimmed.reduce((acc, t) => acc + t, 0);
  return Math.round(sum / trimmed.length);
}

class SolveStore {
  private list = $state<Solve[]>([]);
  private activePuzzle = $state<PuzzleType>('3x3x3');

  constructor() {
    if (browser) {
      try {
        const stored = localStorage.getItem('cubelab-solves');
        if (stored) {
          this.list = JSON.parse(stored);
        } else {
          // Pre-populate with realistic initial session solves for immediate visual delight
          const now = Date.now();
          this.list = [
            {
              id: 'demo-1',
              timeMs: 14250,
              scramble: "D2 F2 R' D2 F2 L' B2 R D2 U2 B' D F2 L R2 U' B L2 R'",
              timestamp: now - 180000,
              penalty: 'none',
              puzzle: '3x3x3'
            },
            {
              id: 'demo-2',
              timeMs: 12890,
              scramble: "R2 U B2 D' F2 U2 R2 D' F2 U' B' R' D' B2 L2 F2 U' L' B' U'",
              timestamp: now - 120000,
              penalty: 'none',
              puzzle: '3x3x3'
            },
            {
              id: 'demo-3',
              timeMs: 11420,
              scramble: "F2 R2 B2 D F2 U L2 U B2 D' F R' D2 B' L2 R' U B' L2 U",
              timestamp: now - 60000,
              penalty: 'none',
              puzzle: '3x3x3'
            },
            {
              id: 'demo-4',
              timeMs: 13180,
              scramble: "U2 F2 L2 U2 B2 R2 D' F2 D2 B2 F' L' B' D B2 R D' L2 B' F'",
              timestamp: now - 30000,
              penalty: 'none',
              puzzle: '3x3x3'
            },
            {
              id: 'demo-5',
              timeMs: 12050,
              scramble: "B2 L2 D2 U2 B' L2 B D2 F' R2 D' B' R D2 U2 L' B' D' R' F2",
              timestamp: now - 10000,
              penalty: 'none',
              puzzle: '3x3x3'
            }
          ];
          this.save();
        }
      } catch (e) {}
    }
  }

  get solves(): Solve[] {
    return this.list.filter((s) => s.puzzle === this.activePuzzle);
  }

  get allSolves(): Solve[] {
    return this.list;
  }

  get puzzle(): PuzzleType {
    return this.activePuzzle;
  }

  setPuzzle(p: PuzzleType) {
    this.activePuzzle = p;
  }

  get stats(): SessionStats {
    const currentList = this.solves;
    const count = currentList.length;
    if (count === 0) {
      return {
        count: 0,
        best: null,
        worst: null,
        currentAo5: null,
        bestAo5: null,
        currentAo12: null,
        bestAo12: null,
        mean: null
      };
    }

    const validTimes = currentList
      .filter((s) => s.penalty !== 'DNF')
      .map((s) => (s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs));

    const best = validTimes.length > 0 ? Math.min(...validTimes) : null;
    const worst = validTimes.length > 0 ? Math.max(...validTimes) : null;
    const sum = validTimes.reduce((acc, t) => acc + t, 0);
    const mean = validTimes.length > 0 ? Math.round(sum / validTimes.length) : null;

    // Current Ao5 (most recent 5 solves)
    let currentAo5: number | null = null;
    if (currentList.length >= 5) {
      const last5 = currentList.slice(0, 5).map((s) => (s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs));
      currentAo5 = calculateTrimmedMean(last5);
    }

    // Current Ao12 (most recent 12 solves)
    let currentAo12: number | null = null;
    if (currentList.length >= 12) {
      const last12 = currentList.slice(0, 12).map((s) => (s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs));
      currentAo12 = calculateTrimmedMean(last12);
    }

    // Best Ao5 in session
    let bestAo5: number | null = null;
    for (let i = 0; i <= currentList.length - 5; i++) {
      const window = currentList.slice(i, i + 5).map((s) => (s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs));
      const avg = calculateTrimmedMean(window);
      if (avg !== null && (bestAo5 === null || avg < bestAo5)) {
        bestAo5 = avg;
      }
    }

    // Best Ao12 in session
    let bestAo12: number | null = null;
    for (let i = 0; i <= currentList.length - 12; i++) {
      const window = currentList.slice(i, i + 12).map((s) => (s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs));
      const avg = calculateTrimmedMean(window);
      if (avg !== null && (bestAo12 === null || avg < bestAo12)) {
        bestAo12 = avg;
      }
    }

    return {
      count,
      best,
      worst,
      currentAo5,
      bestAo5,
      currentAo12,
      bestAo12,
      mean
    };
  }

  addSolve(timeMs: number, scramble: string): Solve {
    const solve: Solve = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `solve-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timeMs,
      scramble,
      timestamp: Date.now(),
      penalty: 'none',
      puzzle: this.activePuzzle
    };
    this.list = [solve, ...this.list];
    this.save();
    return solve;
  }

  deleteSolve(id: string) {
    this.list = this.list.filter((s) => s.id !== id);
    this.save();
  }

  setPenalty(id: string, penalty: 'none' | '+2' | 'DNF') {
    this.list = this.list.map((s) => (s.id === id ? { ...s, penalty } : s));
    this.save();
  }

  clearSession() {
    this.list = this.list.filter((s) => s.puzzle !== this.activePuzzle);
    this.save();
  }

  private save() {
    if (browser) {
      try {
        localStorage.setItem('cubelab-solves', JSON.stringify(this.list));
      } catch (e) {}
    }
  }
}

export const solveStore = new SolveStore();
