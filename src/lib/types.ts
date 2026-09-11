export type TimerState = 'idle' | 'inspecting' | 'holding' | 'ready' | 'running' | 'stopped';

export type Theme = 'light' | 'dark' | 'system';

export type PuzzleType = '3x3x3' | '2x2x2' | '4x4x4' | '3x3 OH';

export interface Solve {
  id: string;
  timeMs: number;
  scramble: string;
  timestamp: number;
  penalty?: 'none' | '+2' | 'DNF';
  puzzle: PuzzleType;
  note?: string;
}

export interface SessionStats {
  count: number;
  best: number | null;
  worst: number | null;
  currentAo5: number | null;
  bestAo5: number | null;
  currentAo12: number | null;
  bestAo12: number | null;
  mean: number | null;
}

export interface ApiAlgorithm {
  id: string;
  category: 'pll' | 'oll';
  case_group: string;
  code: string;
  name: string;
  moves: string;
  alternative_moves: string;
  probability: string;
  image_path: string;
  image_url?: string;
}

export interface AlgorithmItem {
  id: string;
  name: string;
  category: 'PLL' | 'OLL' | 'F2L';
  alg: string;
  setup?: string;
  probability?: string;
  description?: string;
  mastered?: boolean;
}
