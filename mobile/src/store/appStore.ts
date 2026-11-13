import { create } from 'zustand';
import { UserSession, SorteoActivo, JugadaItem } from '../types';
import { setAuthToken } from '../api/client';

interface AppState {
  // Autenticación
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: UserSession, token: string) => void;
  logout: () => void;
  updateSaldo: (nuevoSaldo: number) => void;

  // Sorteo Activo
  sorteoActual: SorteoActivo | null;
  setSorteoActual: (sorteo: SorteoActivo | null) => void;

  // Carrito de Jugadas (POS Móvil)
  jugadas: JugadaItem[];
  agregarJugada: (numero: string, monto: number, premio: number) => void;
  eliminarJugada: (id: string) => void;
  limpiarCarrito: () => void;

  // Hardware Status
  impresoraConectada: boolean;
  impresoraNombre: string | null;
  setImpresoraEstado: (conectada: boolean, nombre?: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token) => {
    setAuthToken(token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null, token: null, isAuthenticated: false, jugadas: [] });
  },

  updateSaldo: (nuevoSaldo) =>
    set((state) => ({
      user: state.user ? { ...state.user, saldoCredito: nuevoSaldo } : null,
    })),

  sorteoActual: null,
  setSorteoActual: (sorteoActual) => set({ sorteoActual }),

  jugadas: [],
  agregarJugada: (numero, monto, premioPotencial) =>
    set((state) => ({
      jugadas: [
        ...state.jugadas,
        {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          numero,
          monto,
          premioPotencial,
        },
      ],
    })),

  eliminarJugada: (id) =>
    set((state) => ({
      jugadas: state.jugadas.filter((j) => j.id !== id),
    })),

  limpiarCarrito: () => set({ jugadas: [] }),

  impresoraConectada: false,
  impresoraNombre: null,
  setImpresoraEstado: (conectada, nombre = null) =>
    set({ impresoraConectada: conectada, impresoraNombre: nombre }),
}));
