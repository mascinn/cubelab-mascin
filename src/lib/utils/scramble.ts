/**
 * WCA-compliant 3x3 Scramble Generator
 * Ensures no consecutive moves on the same face, and avoids 3-move axis collisions (e.g. R L R).
 */

const FACES = ['R', 'L', 'U', 'D', 'F', 'B'] as const;
type Face = typeof FACES[number];

const MODIFIERS = ['', "'", '2'] as const;

// Opposite face mapping (axis groups: [R, L], [U, D], [F, B])
const AXIS_MAP: Record<Face, Face> = {
  R: 'L',
  L: 'R',
  U: 'D',
  D: 'U',
  F: 'B',
  B: 'F'
};

export function generateScramble(length = 21): string {
  const scramble: string[] = [];
  let lastFace: Face | null = null;
  let secondLastFace: Face | null = null;

  for (let i = 0; i < length; i++) {
    const candidates = FACES.filter((face) => {
      // Cannot repeat same face consecutively
      if (face === lastFace) return false;
      // Cannot repeat same axis consecutively (e.g. R L R)
      if (lastFace && secondLastFace && face === secondLastFace && AXIS_MAP[face] === lastFace) {
        return false;
      }
      return true;
    });

    const chosenFace = candidates[Math.floor(Math.random() * candidates.length)];
    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];

    scramble.push(`${chosenFace}${modifier}`);
    secondLastFace = lastFace;
    lastFace = chosenFace;
  }

  return scramble.join(' ');
}
