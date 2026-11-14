import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  Award,
  Ticket,
  Percent,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { CustomSelect } from '../components/common/CustomSelect';
import { Zona } from '../types/zonas';
import { Vendedor } from '../types/vendedores';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [periodo, setPeriodo] = useState<'hoy' | 'ayer' | 'semana'>('hoy');
  const [zonaId, setZonaId] = useState<string>('all');
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resZonas, resVendedores] = await Promise.allSettled([
        api.get<Zona[]>('/zonas?soloActivas=true'),
        api.get<Vendedor[]>('/vendedores')
      ]);

      if (resZonas.status === 'fulfilled') setZonas(resZonas.value.data);
      if (resVendedores.status === 'fulfilled') setVendedores(resVendedores.value.data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodo, zonaId]);

  // Dynamic / Mock combined calculation for admin KPIs
  const totalVenta = periodo === 'hoy' ? 14850 : periodo === 'ayer' ? 18200 : 96400;
  const totalPremios = periodo === 'hoy' ? 8400 : periodo === 'ayer' ? 9800 : 54200;
  const totalComision = totalVenta * 0.10;
  const utilidadNeta = totalVenta - totalPremios - totalComision;
  const boletosTotal = periodo === 'hoy' ? 492 : periodo === 'ayer' ? 610 : 3180;
  const boletosPremiados = periodo === 'hoy' ? 16 : periodo === 'ayer' ? 22 : 98;
  const vendedoresActivosCount = vendedores.filter(v => v.estado).length || 18;
  const totalVendedores = vendedores.length || 20;

  const topVendedores = [
    { nombre: 'Juan Pérez Vendedor', zona: 'Zona Central', ventas: 3450, boletos: 112, comision: 345 },
    { nombre: 'María González López', zona: 'Zona El Recreo', ventas: 2980, boletos: 94, comision: 298 },
    { nombre: 'Carlos Ruiz Silva', zona: 'Zona Norte', ventas: 2420, boletos: 81, comision: 242 },
    { nombre: 'Ana Morales Rivas', zona: 'Zona Central', ventas: 1890, boletos: 65, comision: 189 },
  ];

  const zonasRentabilidad = [
    { nombre: 'Zona Central', coeficiente: 'x85', ventas: 6420, premios: 3600, utilidad: 2178 },
    { nombre: 'Zona El Recreo', coeficiente: 'x80', ventas: 4980, premios: 2800, utilidad: 1682 },
    { nombre: 'Zona Norte', coeficiente: 'x90', ventas: 3450, premios: 2000, utilidad: 1105 },
  ];

  const zonaOptions = [
    { value: 'all', label: 'Todas las Zonas' },
    ...zonas.map(z => ({ value: z.id.toString(), label: z.nombre, sublabel: `x${z.coeficientePremio}` }))
  ];

  return (
    <div className="space-y-6">
      {/* Header con Filtros y Segmentación */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Resumen Operativo</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Métricas de recaudación, premios, comisiones y volumen en tiempo real</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmentación Temporal */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setPeriodo('hoy')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodo === 'hoy'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriodo('ayer')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodo === 'ayer'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ayer
            </button>
            <button
              onClick={() => setPeriodo('semana')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                periodo === 'semana'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Últimos 7 Días
            </button>
          </div>

          {/* Segmentación por Zona */}
          <div className="w-48">
            <CustomSelect
              options={zonaOptions}
              value={zonaId}
              onChange={(val) => setZonaId(val)}
              placeholder="Zona"
            />
          </div>

          <button
            onClick={fetchData}
            title="Recargar Métricas"
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principales (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Venta Total */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Venta Total</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">${totalVenta.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              +12.4% vs período anterior
            </span>
          </div>
        </div>

        {/* Premios Totales */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Premios Pagados</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">${totalPremios.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
              {((totalPremios / totalVenta) * 100).toFixed(1)}% de retorno
            </span>
          </div>
        </div>

        {/* Utilidad Neta */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Utilidad Neta</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">${utilidadNeta.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
              Margen: {((utilidadNeta / totalVenta) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Comisiones Vendedores */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comisiones (10%)</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">${totalComision.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
              {vendedoresActivosCount} vendedores en ruta
            </span>
          </div>
        </div>

        {/* Boletos Emitidos */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Boletos</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{boletosTotal}</h3>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 block">
              {boletosPremiados} boletos ganadores
            </span>
          </div>
        </div>

        {/* Cobertura de Puntos */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendedores Activos</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{vendedoresActivosCount} / {totalVendedores}</h3>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
              {zonas.length || 3} sucursales operativas
            </span>
          </div>
        </div>
      </div>

      {/* Grid Intermedio: Sorteos y Top Vendedores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sorteos del Día */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Estado de Turnos y Sorteos</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Programación oficial de 4 horarios diarios</p>
            </div>
            <Link to="/sorteos" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Gestionar Sorteos &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { hora: '11:00 AM', nombre: 'Sorteo Matutino', estado: 'Liquidado', ganador: '47', ventas: 4250, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30' },
              { hora: '03:00 PM', nombre: 'Sorteo Vespertino', estado: 'Cerrado', ganador: '--', ventas: 3820, badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30' },
              { hora: '06:00 PM', nombre: 'Sorteo Tarde', estado: 'Cerrado', ganador: '--', ventas: 3910, badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30' },
              { hora: '09:00 PM', nombre: 'Sorteo Nocturno', estado: 'Cerrado', ganador: '--', ventas: 2870, badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">
                    {s.hora}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ventas: <span className="font-semibold text-slate-700 dark:text-slate-300">${s.ventas.toLocaleString()}</span> &bull; Ganador: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.ganador}</span>
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${s.badge}`}>
                  {s.estado}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendedores */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Top Vendedores</h4>
              <Link to="/vendedores" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Ver Todos
              </Link>
            </div>

            <div className="space-y-3">
              {topVendedores.map((v, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">{v.nombre}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">${v.ventas.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{v.zona} ({v.boletos} boletos)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">+${v.comision} comisión</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Comisión estándar: <strong className="text-slate-700 dark:text-slate-300">10%</strong></span>
            <Link to="/riesgo" className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              <ShieldAlert className="w-3.5 h-3.5" />
              Cuadrícula 00-99
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Inferior: Rentabilidad por Zona y Monitor de Riesgo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rendimiento por Zona */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Rendimiento por Zona Comercial</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribución de recaudación y margen por sucursal</p>
            </div>
            <Link to="/zonas" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Zonas &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {zonasRentabilidad.map((z, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{z.nombre}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                      {z.coeficiente}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">+${z.utilidad.toLocaleString()} neta</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Ventas: <strong className="text-slate-700 dark:text-slate-300">${z.ventas.toLocaleString()}</strong></span>
                  <span>Premios: <strong className="text-slate-700 dark:text-slate-300">${z.premios.toLocaleString()}</strong></span>
                  <span>Rentabilidad: <strong className="text-emerald-600 dark:text-emerald-400">{((z.utilidad / z.ventas) * 100).toFixed(1)}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monitor Rápido de Números de Alto Volumen */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Monitoreo de Exposición de Números</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Números con mayor concentración de apuestas acumuladas</p>
              </div>
              <Link to="/riesgo" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Ver Cuadrícula Completa &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { num: '47', acumulado: 1250, tope: 1500, pct: 83.3, estado: 'Alerta' },
                { num: '10', acumulado: 890, tope: 1200, pct: 74.1, estado: 'Normal' },
                { num: '92', acumulado: 760, tope: 1000, pct: 76.0, estado: 'Normal' },
              ].map((r, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-black text-sm flex items-center justify-center">
                        {r.num}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Acumulado: ${r.acumulado} / Tope: ${r.tope}
                      </span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      r.pct > 80 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                    }`}>
                      {r.pct.toFixed(0)}% Ocupación
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${r.pct > 80 ? 'bg-rose-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Regla: Bloqueo automático al alcanzar tope comercial</span>
            <Link to="/riesgo" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Gestionar Topes &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
