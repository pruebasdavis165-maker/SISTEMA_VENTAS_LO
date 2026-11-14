import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  CalendarClock, 
  Grid3X3, 
  Calculator, 
  Search, 
  LogOut, 
  Menu, 
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ToastContainer } from '../common/ToastContainer';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Gestión de Zonas', path: '/zonas', icon: MapPin },
    { label: 'Vendedores', path: '/vendedores', icon: Users },
    { label: 'Sorteos y Horarios', path: '/sorteos', icon: CalendarClock },
    { label: 'Cuadrícula 00-99 (Riesgo)', path: '/riesgo', icon: Grid3X3 },
    { label: 'Cierre y Liquidación', path: '/liquidacion', icon: Calculator },
    { label: 'Auditoría de Boletos', path: '/auditoria', icon: Search },
  ];

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Notificaciones globales en esquina superior derecha */}
      <ToastContainer />

      {/* Sidebar Lateral */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out md:static ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        {/* Brand Header */}
        <div className={`flex items-center h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all ${
          sidebarOpen ? 'justify-between px-4' : 'justify-center px-2'
        }`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-xl shrink-0 shadow-sm">
                LO
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white truncate">VENTAS LO</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase">Plataforma Web</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              title="Expandir barra lateral"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-xl shrink-0 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              LO
            </button>
          )}

          {sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(false)}
              title="Colapsar barra lateral"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden md:block cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${
                    sidebarOpen ? 'gap-3 px-3.5 py-2.5 justify-start' : 'justify-center p-2.5'
                  } rounded-xl font-medium text-sm transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                {sidebarOpen && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {sidebarOpen && (
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Card */}
        <div className={`border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 ${
          sidebarOpen ? 'p-3' : 'p-2'
        }`}>
          <div className={`flex items-center ${
            sidebarOpen ? 'gap-3 p-2' : 'flex-col gap-2 p-1.5 justify-center'
          } rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800`}>
            <div 
              title={user?.nombres ? `${user.nombres} ${user.apellidos}` : 'Administrador'}
              className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0"
            >
              {user?.nombres ? user.nombres.charAt(0) : 'A'}
            </div>

            {sidebarOpen ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {user?.nombres ? `${user.nombres} ${user.apellidos}` : 'Administrador'}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="truncate">{user?.rol || 'DIRECTIVO'}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors ml-auto cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/50 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Panel de Control</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Modo Oscuro / Claro */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-semibold cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Route Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
