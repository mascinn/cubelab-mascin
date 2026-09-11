// Auto-generated 3x3 Rubik Net stickers & scramble solver for 2D draw scramble
import { cube3x3x3 } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';

export interface CubeSticker {
  id: string;
  x: number;
  y: number;
  defaultColor: string;
  color: string;
}

export const BASE_STICKERS: Array<{ id: string; x: number; y: number; defaultColor: string }> = [
  {
    "id": "CORNERS-l0-o0",
    "x": 5.3,
    "y": 2.1,
    "defaultColor": "#ffffff"
  },
  {
    "id": "CORNERS-l0-o1",
    "x": 6.5,
    "y": 3.3,
    "defaultColor": "#ef4444"
  },
  {
    "id": "CORNERS-l0-o2",
    "x": 5.3,
    "y": 3.3,
    "defaultColor": "#22c55e"
  },
  {
    "id": "CORNERS-l1-o0",
    "x": 5.3,
    "y": 0.1,
    "defaultColor": "#ffffff"
  },
  {
    "id": "CORNERS-l1-o1",
    "x": 9.7,
    "y": 3.3,
    "defaultColor": "#3b82f6"
  },
  {
    "id": "CORNERS-l1-o2",
    "x": 8.5,
    "y": 3.3,
    "defaultColor": "#ef4444"
  },
  {
    "id": "CORNERS-l2-o0",
    "x": 3.3,
    "y": 0.1,
    "defaultColor": "#ffffff"
  },
  {
    "id": "CORNERS-l2-o1",
    "x": 0.1,
    "y": 3.3,
    "defaultColor": "#f97316"
  },
  {
    "id": "CORNERS-l2-o2",
    "x": 11.7,
    "y": 3.3,
    "defaultColor": "#3b82f6"
  },
  {
    "id": "CORNERS-l3-o0",
    "x": 3.3,
    "y": 2.1,
    "defaultColor": "#ffffff"
  },
  {
    "id": "CORNERS-l3-o1",
    "x": 3.3,
    "y": 3.3,
    "defaultColor": "#22c55e"
  },
  {
    "id": "CORNERS-l3-o2",
    "x": 2.1,
    "y": 3.3,
    "defaultColor": "#f97316"
  },
  {
    "id": "CORNERS-l4-o0",
    "x": 5.3,
    "y": 6.5,
    "defaultColor": "#facc15"
  },
  {
    "id": "CORNERS-l4-o1",
    "x": 5.3,
    "y": 5.3,
    "defaultColor": "#22c55e"
  },
  {
    "id": "CORNERS-l4-o2",
    "x": 6.5,
    "y": 5.3,
    "defaultColor": "#ef4444"
  },
  {
    "id": "CORNERS-l5-o0",
    "x": 3.3,
    "y": 6.5,
    "defaultColor": "#facc15"
  },
  {
    "id": "CORNERS-l5-o1",
    "x": 2.1,
    "y": 5.3,
    "defaultColor": "#f97316"
  },
  {
    "id": "CORNERS-l5-o2",
    "x": 3.3,
    "y": 5.3,
    "defaultColor": "#22c55e"
  },
  {
    "id": "CORNERS-l6-o0",
    "x": 3.3,
    "y": 8.5,
    "defaultColor": "#facc15"
  },
  {
    "id": "CORNERS-l6-o1",
    "x": 11.7,
    "y": 5.3,
    "defaultColor": "#3b82f6"
  },
  {
    "id": "CORNERS-l6-o2",
    "x": 0.1,
    "y": 5.3,
    "defaultColor": "#f97316"
  },
  {
    "id": "CORNERS-l7-o0",
    "x": 5.3,
    "y": 8.5,
    "defaultColor": "#facc15"
  },
  {
    "id": "CORNERS-l7-o1",
    "x": 8.5,
    "y": 5.3,
    "defaultColor": "#ef4444"
  },
  {
    "id": "CORNERS-l7-o2",
    "x": 9.7,
    "y": 5.3,
    "defaultColor": "#3b82f6"
  },
  {
    "id": "EDGES-l0-o0",
    "x": 4.3,
    "y": 2.1,
    "defaultColor": "#ffffff"
  },
  {
    "id": "EDGES-l0-o1",
    "x": 4.3,
    "y": 3.3,
    "defaultColor": "#22c55e"
  },
  {
    "id": "EDGES-l1-o0",
    "x": 5.3,
    "y": 1.1,
    "defaultColor": "#ffffff"
  },
  {
    "id": "EDGES-l1-o1",
    "x": 7.5,
    "y": 3.3,
    "defaultColor": "#ef4444"
  },
  {
    "id": "EDGES-l2-o0",
    "x": 4.3,
    "y": 0.1,
    "defaultColor": "#ffffff"
  },
  {
    "id": "EDGES-l2-o1",
    "x": 10.7,
    "y": 3.3,
    "defaultColor": "#3b82f6"
  },
  {
    "id": "EDGES-l3-o0",
    "x": 3.3,
    "y": 1.1,
    "defaultColor": "#ffffff"
  },
  {
    "id": "EDGES-l3-o1",
    "x": 1.1,
    "y": 3.3,
    "defaultColor": "#f97316"
  },
  {
    "id": "EDGES-l4-o0",
    "x": 4.3,
    "y": 6.5,
    "defaultColor": "#facc15"
  },
  {
    "id": "EDGES-l4-o1",
    "x": 4.3,
    "y": 5.3,
    "defaultColor": "#22c55e"
  },
  {
    "id": "EDGES-l5-o0",
    "x": 5.3,
    "y": 7.5,
    "defaultColor": "#facc15"
  },
  {
    "id": "EDGES-l5-o1",
    "x": 7.5,
    "y": 5.3,
    "defaultColor": "#ef4444"
  },
  {
    "id": "EDGES-l6-o0",
    "x": 4.3,
    "y": 8.5,
    "defaultColor": "#facc15"
  },
  {
    "id": "EDGES-l6-o1",
    "x": 10.7,
    "y": 5.3,
    "defaultColor": "#3b82f6"
  },
  {
    "id": "EDGES-l7-o0",
    "x": 3.3,
    "y": 7.5,
    "defaultColor": "#facc15"
  },
  {
    "id": "EDGES-l7-o1",
    "x": 1.1,
    "y": 5.3,
    "defaultColor": "#f97316"
  },
  {
    "id": "EDGES-l8-o0",
    "x": 5.3,
    "y": 4.3,
    "defaultColor": "#22c55e"
  },
  {
    "id": "EDGES-l8-o1",
    "x": 6.5,
    "y": 4.3,
    "defaultColor": "#ef4444"
  },
  {
    "id": "EDGES-l9-o0",
    "x": 3.3,
    "y": 4.3,
    "defaultColor": "#22c55e"
  },
  {
    "id": "EDGES-l9-o1",
    "x": 2.1,
    "y": 4.3,
    "defaultColor": "#f97316"
  },
  {
    "id": "EDGES-l10-o0",
    "x": 9.7,
    "y": 4.3,
    "defaultColor": "#3b82f6"
  },
  {
    "id": "EDGES-l10-o1",
    "x": 8.5,
    "y": 4.3,
    "defaultColor": "#ef4444"
  },
  {
    "id": "EDGES-l11-o0",
    "x": 11.7,
    "y": 4.3,
    "defaultColor": "#3b82f6"
  },
  {
    "id": "EDGES-l11-o1",
    "x": 0.1,
    "y": 4.3,
    "defaultColor": "#f97316"
  },
  {
    "id": "CENTERS-l0-o0",
    "x": 4.3,
    "y": 1.1,
    "defaultColor": "#ffffff"
  },
  {
    "id": "CENTERS-l1-o0",
    "x": 1.1,
    "y": 4.3,
    "defaultColor": "#f97316"
  },
  {
    "id": "CENTERS-l2-o0",
    "x": 4.3,
    "y": 4.3,
    "defaultColor": "#22c55e"
  },
  {
    "id": "CENTERS-l3-o0",
    "x": 7.5,
    "y": 4.3,
    "defaultColor": "#ef4444"
  },
  {
    "id": "CENTERS-l4-o0",
    "x": 10.7,
    "y": 4.3,
    "defaultColor": "#3b82f6"
  },
  {
    "id": "CENTERS-l5-o0",
    "x": 4.3,
    "y": 7.5,
    "defaultColor": "#facc15"
  }
];

export const DEFAULT_COLORS_MAP: Record<string, string> = {
  "CORNERS-l0-o0": "#ffffff",
  "CORNERS-l0-o1": "#ef4444",
  "CORNERS-l0-o2": "#22c55e",
  "CORNERS-l1-o0": "#ffffff",
  "CORNERS-l1-o1": "#3b82f6",
  "CORNERS-l1-o2": "#ef4444",
  "CORNERS-l2-o0": "#ffffff",
  "CORNERS-l2-o1": "#f97316",
  "CORNERS-l2-o2": "#3b82f6",
  "CORNERS-l3-o0": "#ffffff",
  "CORNERS-l3-o1": "#22c55e",
  "CORNERS-l3-o2": "#f97316",
  "CORNERS-l4-o0": "#facc15",
  "CORNERS-l4-o1": "#22c55e",
  "CORNERS-l4-o2": "#ef4444",
  "CORNERS-l5-o0": "#facc15",
  "CORNERS-l5-o1": "#f97316",
  "CORNERS-l5-o2": "#22c55e",
  "CORNERS-l6-o0": "#facc15",
  "CORNERS-l6-o1": "#3b82f6",
  "CORNERS-l6-o2": "#f97316",
  "CORNERS-l7-o0": "#facc15",
  "CORNERS-l7-o1": "#ef4444",
  "CORNERS-l7-o2": "#3b82f6",
  "EDGES-l0-o0": "#ffffff",
  "EDGES-l0-o1": "#22c55e",
  "EDGES-l1-o0": "#ffffff",
  "EDGES-l1-o1": "#ef4444",
  "EDGES-l2-o0": "#ffffff",
  "EDGES-l2-o1": "#3b82f6",
  "EDGES-l3-o0": "#ffffff",
  "EDGES-l3-o1": "#f97316",
  "EDGES-l4-o0": "#facc15",
  "EDGES-l4-o1": "#22c55e",
  "EDGES-l5-o0": "#facc15",
  "EDGES-l5-o1": "#ef4444",
  "EDGES-l6-o0": "#facc15",
  "EDGES-l6-o1": "#3b82f6",
  "EDGES-l7-o0": "#facc15",
  "EDGES-l7-o1": "#f97316",
  "EDGES-l8-o0": "#22c55e",
  "EDGES-l8-o1": "#ef4444",
  "EDGES-l9-o0": "#22c55e",
  "EDGES-l9-o1": "#f97316",
  "EDGES-l10-o0": "#3b82f6",
  "EDGES-l10-o1": "#ef4444",
  "EDGES-l11-o0": "#3b82f6",
  "EDGES-l11-o1": "#f97316",
  "CENTERS-l0-o0": "#ffffff",
  "CENTERS-l0-o1": "#ffffff",
  "CENTERS-l0-o2": "#ffffff",
  "CENTERS-l0-o3": "#ffffff",
  "CENTERS-l1-o0": "#f97316",
  "CENTERS-l1-o1": "#f97316",
  "CENTERS-l1-o2": "#f97316",
  "CENTERS-l1-o3": "#f97316",
  "CENTERS-l2-o0": "#22c55e",
  "CENTERS-l2-o1": "#22c55e",
  "CENTERS-l2-o2": "#22c55e",
  "CENTERS-l2-o3": "#22c55e",
  "CENTERS-l3-o0": "#ef4444",
  "CENTERS-l3-o1": "#ef4444",
  "CENTERS-l3-o2": "#ef4444",
  "CENTERS-l3-o3": "#ef4444",
  "CENTERS-l4-o0": "#3b82f6",
  "CENTERS-l4-o1": "#3b82f6",
  "CENTERS-l4-o2": "#3b82f6",
  "CENTERS-l4-o3": "#3b82f6",
  "CENTERS-l5-o0": "#facc15",
  "CENTERS-l5-o1": "#facc15",
  "CENTERS-l5-o2": "#facc15",
  "CENTERS-l5-o3": "#facc15"
};

let cachedKPuzzle: any = null;

async function getKPuzzle() {
  if (!cachedKPuzzle) {
    cachedKPuzzle = await cube3x3x3.kpuzzle();
  }
  return cachedKPuzzle;
}

export async function computeScrambleStickers(scramble: string): Promise<CubeSticker[]> {
  if (!scramble || !scramble.trim()) {
    return BASE_STICKERS.map((s) => ({ ...s, color: s.defaultColor }));
  }

  try {
    const kpuzzle = await getKPuzzle();
    const alg = new Alg(scramble.trim());
    const pattern = kpuzzle.defaultPattern().applyAlg(alg);

    return BASE_STICKERS.map((s) => {
      const parts = s.id.split('-');
      const orbitName = parts[0];
      const pieceIdx = parseInt(parts[1].slice(1), 10);
      const orientation = parseInt(parts[2].slice(1), 10);

      const orbitDef = kpuzzle.definition.orbits.find((o: any) => o.orbitName === orbitName);
      const currentPatternOrbit = pattern.patternData[orbitName];

      const fromPiece = currentPatternOrbit.pieces[pieceIdx];
      const fromOrientation =
        (orbitDef.numOrientations - currentPatternOrbit.orientation[pieceIdx] + orientation) %
        orbitDef.numOrientations;
      const fromId = `${orbitName}-l${fromPiece}-o${fromOrientation}`;

      return {
        ...s,
        color: DEFAULT_COLORS_MAP[fromId] || s.defaultColor
      };
    });
  } catch (err) {
    console.error('Failed to parse or calculate scramble for 2D net:', err);
    return BASE_STICKERS.map((s) => ({ ...s, color: s.defaultColor }));
  }
}
