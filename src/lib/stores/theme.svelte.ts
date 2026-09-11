import { browser } from '$app/environment';
import type { Theme } from '$lib/types';

class ThemeManager {
  private current = $state<Theme>('system');
  private isDark = $state<boolean>(false);

  constructor() {
    if (browser) {
      const stored = localStorage.getItem('cubelab-theme') as Theme | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        this.current = stored;
      }
      this.sync();

      // Listen for OS color scheme preference changes
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
          if (this.current === 'system') {
            this.sync();
          }
        });
      } catch (e) {}
    }
  }

  get value(): Theme {
    return this.current;
  }

  get dark(): boolean {
    return this.isDark;
  }

  set(newTheme: Theme) {
    this.current = newTheme;
    if (browser) {
      try {
        localStorage.setItem('cubelab-theme', newTheme);
      } catch (e) {}
      this.sync();
    }
  }

  toggle() {
    this.set(this.isDark ? 'light' : 'dark');
  }

  private sync() {
    if (!browser) return;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = this.current === 'dark' || (this.current === 'system' && prefersDark);
    this.isDark = shouldBeDark;

    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

export const theme = new ThemeManager();
