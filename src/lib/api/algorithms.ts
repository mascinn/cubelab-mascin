import type { ApiAlgorithm } from '$lib/types';
import { browser } from '$app/environment';
import defaultAlgorithms from '$lib/data/algorithms.json';

let cachedAlgorithms: ApiAlgorithm[] | null = null;

export async function fetchAllAlgorithms(): Promise<ApiAlgorithm[]> {
  if (cachedAlgorithms && cachedAlgorithms.length > 0) {
    return cachedAlgorithms;
  }

  // Attempt session storage cache
  if (browser) {
    try {
      const stored = sessionStorage.getItem('cubelab-api-algorithms');
      if (stored) {
        cachedAlgorithms = JSON.parse(stored);
        if (cachedAlgorithms && cachedAlgorithms.length > 0) {
          return cachedAlgorithms;
        }
      }
    } catch (e) {}
  }

  // Try fetching from local/Vercel API endpoint
  const endpoints = ['/api/algorithms', 'http://localhost:8085/api/algorithms'];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          cachedAlgorithms = json.data;
          if (browser) {
            try {
              sessionStorage.setItem('cubelab-api-algorithms', JSON.stringify(json.data));
            } catch (e) {}
          }
          return json.data;
        }
      }
    } catch (err) {
      // Try next endpoint
    }
  }

  // Fallback to bundled algorithms dataset (guarantees 100% offline & Vercel reliability)
  cachedAlgorithms = defaultAlgorithms as ApiAlgorithm[];
  return cachedAlgorithms;
}

/**
 * Resolves local image path from the API's image_path
 * e.g. "/static/images/pll/t-perm.svg" -> "/images/pll/t-perm.svg"
 */
export function resolveCaseImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Convert /static/images/... to /images/...
  return imagePath.replace(/^\/static\/images\//, '/images/');
}
