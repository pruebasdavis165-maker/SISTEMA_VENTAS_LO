import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si no tiene rol ADMIN (ej. si un vendedor intenta entrar al panel web directivo)
  if (user && user.rol !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6 text-center">
        <div className="p-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mb-4">
          Acceso Restringido
        </div>
        <h2 className="text-2xl font-bold mb-2">Acceso Exclusivo para Administradores</h2>
        <p className="text-slate-400 max-w-md text-sm mb-6">
          Tu cuenta tiene rol <strong>{user.rol}</strong>. La plataforma web está reservada para control directivo. Para realizar ventas, por favor utiliza la Aplicación Móvil Android.
        </p>
        <button
          onClick={() => {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    );
  }

  return <Outlet />;
};
