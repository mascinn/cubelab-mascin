/**
 * Format milliseconds into separated main and decimal parts for styling
 */
export function formatTimeParts(ms: number, penalty: 'none' | '+2' | 'DNF' = 'none'): { main: string; decimals: string; formatted: string } {
  if (penalty === 'DNF') {
    return { main: 'DNF', decimals: '', formatted: 'DNF' };
  }

  const effectiveMs = penalty === '+2' ? ms + 2000 : ms;
  if (effectiveMs <= 0) {
    return { main: '0', decimals: '.00', formatted: '0.00' };
  }

  const totalSeconds = effectiveMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((effectiveMs % 1000) / 10);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const decStr = `.${pad(hundredths)}`;

  if (minutes > 0) {
    const mainStr = `${minutes}:${pad(seconds)}`;
    return {
      main: mainStr,
      decimals: decStr,
      formatted: `${mainStr}${decStr}${penalty === '+2' ? '+' : ''}`
    };
  }

  const mainStr = `${seconds}`;
  return {
    main: mainStr,
    decimals: decStr,
    formatted: `${mainStr}${decStr}${penalty === '+2' ? '+' : ''}`
  };
}

export function formatTimeShort(ms: number | null): string {
  if (ms === null || isNaN(ms)) return '-';
  return formatTimeParts(ms).formatted;
}
