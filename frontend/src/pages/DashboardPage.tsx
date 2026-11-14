import React from 'react';
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  CalendarClock, 
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const stats = [
    { title: 'Venta Total Hoy', value: '$12,450.00', icon: TrendingUp, change: '+14%', color: 'bg-indigo-600' },
    { title: 'Vendedores Activos', value: '18 / 20', icon: Users, change: '90% activos', color: 'bg-emerald-600' },
    { title: 'Zonas Operativas', value: '3 Sucursales', icon: MapPin, change: '100% cubierto', color: 'bg-purple-600' },
    { title: 'Próximo Sorteo', value: '03:00 PM', icon: CalendarClock, change: 'Cierra en 42 min', color: 'bg-amber-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-3">
            SISTEMA DE GESTIÓN Y VENTAS
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bienvenido al Centro de Control de Lotería y Chances
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Monitoreo en tiempo real de cuadrículas 00-99, control de límites de riesgo por número, liquidación de sorteos y trazabilidad antifraude de boletos térmicos.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-500/50 transition-all shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</span>
                <div className={`p-2.5 rounded-xl ${stat.color} text-white shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
                <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sorteos en Curso y Alertas de Riesgo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">Estado de Sorteos del Día</h4>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">4 Horarios Oficiales</span>
          </div>
          <div className="space-y-3">
            {[
              { hora: '11:00 AM', nombre: 'Sorteo Matutino', estado: 'Liquidado', ganador: '47', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30' },
              { hora: '03:00 PM', nombre: 'Sorteo Vespertino', estado: 'Venta Abierta', ganador: '--', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30' },
              { hora: '06:00 PM', nombre: 'Sorteo Tarde', estado: 'Programado', ganador: '--', badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
              { hora: '09:00 PM', nombre: 'Sorteo Nocturno', estado: 'Programado', ganador: '--', badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200">
                    {s.hora}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ganador: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.ganador}</span></p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${s.badge}`}>
                  {s.estado}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerta de Control de Riesgo */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm mb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Alerta de Control de Riesgo
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              El motor de control de riesgos monitorea la cuadrícula del 00 al 99. Cuando un número supera el tope comercial definido por la directiva, se puede cortar la venta de inmediato.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
              <p className="font-semibold">Regla de Tiempo Activa:</p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-400">Bloqueo automático de venta previo al sorteo.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
