import { create } from 'zustand';

export interface UserProfile {
  id: string;
  username: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  rol: string;
  zonaId: number | null;
  zonaNombre: string | null;
  coeficientePremio: number | null;
  saldoCredito: number;
  precioBase: number;
  precioVenta: number;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('lo_access_token');
  const savedUserJson = localStorage.getItem('lo_user_profile');
  let savedUser: UserProfile | null = null;

  try {
    if (savedUserJson) {
      savedUser = JSON.parse(savedUserJson);
    }
  } catch {
    savedUser = null;
  }

  return {
    token: savedToken,
    user: savedUser,
    isAuthenticated: !!savedToken,
    setAuth: (token: string, user: UserProfile) => {
      localStorage.setItem('lo_access_token', token);
      localStorage.setItem('lo_user_profile', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('lo_access_token');
      localStorage.removeItem('lo_user_profile');
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});
