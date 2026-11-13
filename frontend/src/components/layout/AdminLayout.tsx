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
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
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
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar Lateral */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out md:static ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20 text-white font-black text-xl shrink-0">
              LO
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-wide text-white truncate">VENTAS LO</span>
                <span className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase">Plataforma Web</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors hidden md:block"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                {sidebarOpen && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {sidebarOpen && (
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
              {user?.nombres ? user.nombres.charAt(0) : 'A'}
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.nombres ? `${user.nombres} ${user.apellidos}` : 'Administrador'}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="truncate">{user?.rol || 'DIRECTIVO'}</span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-white tracking-tight">Panel de Control General</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Servidor Conectado
            </div>
          </div>
        </header>

        {/* Dynamic Route Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
