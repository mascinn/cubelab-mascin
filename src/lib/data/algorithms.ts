import type { AlgorithmItem } from '$lib/types';

export const ALGORITHMS: AlgorithmItem[] = [
  // PLLs
  {
    id: 'pll-t',
    name: 'T Permutation',
    category: 'PLL',
    alg: "R U R' U' R' F R2 U' R' U' R U R' F'",
    probability: '1/18',
    description: 'Swaps two adjacent corners and two opposite edges'
  },
  {
    id: 'pll-jb',
    name: 'Jb Permutation',
    category: 'PLL',
    alg: "R U R' F' R U R' U' R' F R2 U' R'",
    probability: '1/18',
    description: 'Swaps front-right and back-right corners and edges'
  },
  {
    id: 'pll-ja',
    name: 'Ja Permutation',
    category: 'PLL',
    alg: "L' U' L F L' U' L U L F' L2' U L",
    probability: '1/18',
    description: 'Mirror of Jb permutation on the left side'
  },
  {
    id: 'pll-y',
    name: 'Y Permutation',
    category: 'PLL',
    alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    probability: '1/18',
    description: 'Swaps diagonal corners and two adjacent edges'
  },
  {
    id: 'pll-ua',
    name: 'Ua Permutation',
    category: 'PLL',
    alg: "M2' U M U2 M' U M2'",
    probability: '1/18',
    description: '3-cycle edges clockwise'
  },
  {
    id: 'pll-ub',
    name: 'Ub Permutation',
    category: 'PLL',
    alg: "M2' U' M U2 M' U' M2'",
    probability: '1/18',
    description: '3-cycle edges counter-clockwise'
  },
  {
    id: 'pll-h',
    name: 'H Permutation',
    category: 'PLL',
    alg: "M2' U M2' U2 M2' U M2'",
    probability: '1/72',
    description: 'Swaps opposite edge pairs across both axes'
  },
  {
    id: 'pll-z',
    name: 'Z Permutation',
    category: 'PLL',
    alg: "M' U M2' U M2' U M' U2 M2'",
    probability: '1/36',
    description: 'Swaps adjacent edge pairs (front-right and back-left)'
  },
  {
    id: 'pll-aa',
    name: 'Aa Permutation',
    category: 'PLL',
    alg: "x R' U R' D2 R U' R' D2 R2 x'",
    probability: '1/18',
    description: 'Corner 3-cycle clockwise'
  },
  {
    id: 'pll-ab',
    name: 'Ab Permutation',
    category: 'PLL',
    alg: "x R2 D2 R' U' R D2 R' U R' x'",
    probability: '1/18',
    description: 'Corner 3-cycle counter-clockwise'
  },
  {
    id: 'pll-ra',
    name: 'Ra Permutation',
    category: 'PLL',
    alg: "R U R' F' R U2 R' U2 R' F R U R U2 R'",
    probability: '1/18',
    description: 'Adjacent corner swap with edge cycle'
  },

  // OLLs
  {
    id: 'oll-sune',
    name: 'Sune (OLL 27)',
    category: 'OLL',
    alg: "R U R' U R U2' R'",
    probability: '1/54',
    description: 'One oriented corner, counter-clockwise cycle'
  },
  {
    id: 'oll-antisune',
    name: 'Anti-Sune (OLL 26)',
    category: 'OLL',
    alg: "R U2' R' U' R U' R'",
    probability: '1/54',
    description: 'One oriented corner, clockwise cycle'
  },
  {
    id: 'oll-h',
    name: 'Double Sune / H (OLL 21)',
    category: 'OLL',
    alg: "R U R' U R U' R' U R U2' R'",
    probability: '1/108',
    description: 'No corners oriented, two pairs facing opposite'
  },
  {
    id: 'oll-pi',
    name: 'Pi (OLL 22)',
    category: 'OLL',
    alg: "R U2' R2' U' R2 U' R2' U2' R",
    probability: '1/54',
    description: 'Two headlights facing front, two facing left/right'
  },
  {
    id: 'oll-t',
    name: 'T-Shape (OLL 33)',
    category: 'OLL',
    alg: "R U R' U' R' F R F'",
    probability: '1/54',
    description: 'T-shaped yellow pattern with side headlights'
  },
  {
    id: 'oll-bowtie',
    name: 'Bowtie (OLL 25)',
    category: 'OLL',
    alg: "F' r U R' U' r' F R",
    probability: '1/54',
    description: 'Two diagonal corners oriented'
  },

  // F2L
  {
    id: 'f2l-basic-1',
    name: 'Basic Insert (Right)',
    category: 'F2L',
    alg: "U R U' R'",
    description: 'Corner and edge paired in U layer, ready for slotting'
  },
  {
    id: 'f2l-basic-2',
    name: 'Basic Insert (Left)',
    category: 'F2L',
    alg: "U' L' U L",
    description: 'Left slot insertion for paired pieces'
  },
  {
    id: 'f2l-split',
    name: 'Connected Inverted Pair',
    category: 'F2L',
    alg: "R U' R' U R U R'",
    description: 'Separating incorrectly connected corner and edge'
  }
];
