import { create } from 'zustand';

interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme_preference');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  }
  return 'dark';
};

const applyThemeToDocument = (theme: 'dark' | 'light') => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme_preference', theme);
  }
};

// Aplicar al importar
const initial = getInitialTheme();
applyThemeToDocument(initial);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initial,
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyThemeToDocument(nextTheme);
      return { theme: nextTheme };
    }),
  setTheme: (theme) => {
    applyThemeToDocument(theme);
    set({ theme });
  },
}));
