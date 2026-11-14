import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  Award,
  Ticket,
  Percent,
  RefreshCw,
  ShieldAlert,
  X,
  UserCheck,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { CustomSelect } from '../components/common/CustomSelect';
import { CustomDateRangePicker, DateRange } from '../components/common/CustomDateRangePicker';
import { Zona } from '../types/zonas';
import { Vendedor } from '../types/vendedores';
import { DashboardReporte, TopVendedorMetricas } from '../types/reportes';
import { Link } from 'react-router-dom';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DashboardPage: React.FC = () => {
  const hoyStr = getLocalDateString();
  const [dateRange, setDateRange] = useState<DateRange>({
    desde: hoyStr,
    hasta: hoyStr,
    label: 'Hoy'
  });

  const [zonaId, setZonaId] = useState<string>('all');
  const [vendedorId, setVendedorId] = useState<string>('all');
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [reporte, setReporte] = useState<DashboardReporte | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modales interactivos
  const [selectedKpiModal, setSelectedKpiModal] = useState<string | null>(null);
  const [selectedVendedorModal, setSelectedVendedorModal] = useState<TopVendedorMetricas | null>(null);

  const fetchCatalogos = async () => {
    try {
      const [resZonas, resVendedores] = await Promise.allSettled([
        api.get<Zona[]>('/zonas?soloActivas=true'),
        api.get<Vendedor[]>('/vendedores')
      ]);

      if (resZonas.status === 'fulfilled') setZonas(resZonas.value.data);
      if (resVendedores.status === 'fulfilled') setVendedores(resVendedores.value.data);
    } catch {
      // Ignorar fallback
    }
  };

  const fetchMetricas = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        fechaDesde: dateRange.desde,
        fechaHasta: dateRange.hasta,
      };
      if (zonaId !== 'all') params.zonaId = Number(zonaId);
      if (vendedorId !== 'all') params.vendedorId = vendedorId;

      const res = await api.get<DashboardReporte>('/reportes/dashboard', { params });
      setReporte(res.data);
    } catch {
      // Fallback amigable
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogos();
  }, []);

  useEffect(() => {
    fetchMetricas();
  }, [dateRange, zonaId, vendedorId]);

  const zonaOptions = [
    { value: 'all', label: 'Todas las Zonas (Consolidado)' },
    ...zonas.map(z => ({ value: z.id.toString(), label: z.nombre, sublabel: `x${z.coeficientePremio}` }))
  ];

  const vendedorOptions = [
    { value: 'all', label: 'Todos los Vendedores' },
    ...vendedores.map(v => ({ value: v.id, label: `${v.nombres} ${v.apellidos}`.trim() || v.username, sublabel: v.zonaNombre || 'General' }))
  ];

  // Métricas extraídas del reporte o cálculo dinámico
  const ventaTotal = reporte?.ventaTotal ?? 0;
  const premiosPagados = reporte?.premiosPagados ?? 0;
  const comisionesTotal = reporte?.comisionesTotal ?? 0;
  const utilidadNeta = reporte?.utilidadNeta ?? 0;
  const totalBoletos = reporte?.totalBoletos ?? 0;
  const boletosPremiados = reporte?.boletosPremiados ?? 0;
  const vendedoresActivos = reporte?.vendedoresActivos ?? (vendedores.filter(v => v.estado).length || 1);
  const totalVendedores = reporte?.totalVendedores ?? (vendedores.length || 1);

  const topVendedores = reporte?.topVendedores?.length 
    ? reporte.topVendedores 
    : vendedores.map(v => ({
        vendedorId: v.id,
        nombre: `${v.nombres} ${v.apellidos}`.trim() || v.username,
        cedula: v.cedula,
        zonaNombre: v.zonaNombre || 'General',
        ventas: 0,
        boletos: 0,
        comision: 0,
        premios: 0,
        balanceNeto: 0,
        jugadasMasVendidas: []
      }));

  const desgloseZonas = reporte?.desgloseZonas?.length 
    ? reporte.desgloseZonas 
    : zonas.map(z => ({
        zonaId: z.id,
        nombre: z.nombre,
        coeficiente: `x${z.coeficientePremio}`,
        ventas: 0,
        premios: 0,
        comisiones: 0,
        utilidad: 0,
        vendedoresCount: z.cantidadVendedores || 0
      }));

  return (
    <div className="space-y-6">
      {/* 1. Header con Filtros Dinámicos y Rango de Fechas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Panel de Control General</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Métricas de recaudación, premios, comisiones y volumen consolidado en tiempo real
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Rango de Fechas */}
          <CustomDateRangePicker
            value={dateRange}
            onChange={(r) => setDateRange(r)}
          />

          {/* Segmentación por Zona */}
          <div className="w-48">
            <CustomSelect
              options={zonaOptions}
              value={zonaId}
              onChange={(val) => setZonaId(val)}
              placeholder="Zona"
            />
          </div>

          {/* Segmentación por Vendedor */}
          <div className="w-48">
            <CustomSelect
              options={vendedorOptions}
              value={vendedorId}
              onChange={(val) => setVendedorId(val)}
              placeholder="Vendedor"
            />
          </div>

          <button
            onClick={fetchMetricas}
            title="Recargar Métricas"
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Grid de Métricas Principales (KPI Cards con Click para Detalle) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Venta Total */}
        <div 
          onClick={() => setSelectedKpiModal('ventas')}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-indigo-500/60 dark:hover:border-indigo-400/60 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Venta Total</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono">
              ${ventaTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="inline-flex items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 gap-0.5 mt-1">
              Ver detalle &rarr;
            </span>
          </div>
        </div>

        {/* Premios Pagados */}
        <div 
          onClick={() => setSelectedKpiModal('premios')}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-rose-500/60 dark:hover:border-rose-400/60 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Premios Pagados</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
              ${premiosPagados.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
              {ventaTotal > 0 ? ((premiosPagados / ventaTotal) * 100).toFixed(1) : '0.0'}% de retorno
            </span>
          </div>
        </div>

        {/* Utilidad Neta */}
        <div 
          onClick={() => setSelectedKpiModal('utilidad')}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/60 dark:hover:border-emerald-400/60 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Utilidad Neta</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ${utilidadNeta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 block">
              Margen: {ventaTotal > 0 ? ((utilidadNeta / ventaTotal) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>

        {/* Comisiones de Vendedores */}
        <div 
          onClick={() => setSelectedKpiModal('comisiones')}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-amber-500/60 dark:hover:border-amber-400/60 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comisiones</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono">
              ${comisionesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
              10% sobre ventas
            </span>
          </div>
        </div>

        {/* Boletos Emitidos */}
        <div 
          onClick={() => setSelectedKpiModal('boletos')}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-purple-500/60 dark:hover:border-purple-400/60 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Boletos</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono">{totalBoletos}</h3>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 block">
              {boletosPremiados} ganadores
            </span>
          </div>
        </div>

        {/* Vendedores Activos */}
        <div 
          onClick={() => setSelectedKpiModal('vendedores')}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-sky-500/60 dark:hover:border-sky-400/60 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendedores</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono">{vendedoresActivos} / {totalVendedores}</h3>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
              {zonas.length || 3} sucursales
            </span>
          </div>
        </div>
      </div>

      {/* 3. Grid Intermedio: Turnos y Top Vendedores Interactivos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sorteos del Día */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Estado de Turnos y Sorteos</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Horarios oficiales y estado de venta</p>
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

        {/* Top Vendedores con Click para Ver Métricas Detalladas */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Top Vendedores</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Haz clic en un vendedor para ver sus métricas</p>
              </div>
              <Link to="/vendedores" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Ver Todos
              </Link>
            </div>

            <div className="space-y-3">
              {topVendedores.map((v) => (
                <div 
                  key={v.vendedorId}
                  onClick={() => setSelectedVendedorModal(v)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{v.nombre}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">${v.ventas.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{v.zonaNombre} ({v.boletos} boletos)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">+${v.comision.toFixed(0)} comisión</span>
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

      {/* 4. Grid Inferior: Rendimiento por Sucursal */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">Rendimiento por Zona Comercial</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distribución de recaudación, premios y margen neto por sucursal</p>
          </div>
          <Link to="/zonas" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Gestionar Zonas &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {desgloseZonas.map((z) => (
            <div key={z.zonaId} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{z.nombre}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                    {z.coeficiente}
                  </span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">+${z.utilidad.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span>Ventas: <strong className="text-slate-700 dark:text-slate-300">${z.ventas.toLocaleString()}</strong></span>
                <span>Premios: <strong className="text-slate-700 dark:text-slate-300">${z.premios.toLocaleString()}</strong></span>
                <span>Vendedores: <strong className="text-slate-700 dark:text-slate-300">{z.vendedoresCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: Métricas Detalladas de Vendedor (Al hacer clic en Top Vendedores) */}
      {selectedVendedorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedVendedorModal.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cédula: {selectedVendedorModal.cedula || '--'} &bull; {selectedVendedorModal.zonaNombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVendedorModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid de Métricas de este Vendedor */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Vendido</span>
                <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
                  ${selectedVendedorModal.ventas.toLocaleString()}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Boletos Emitidos</span>
                <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
                  {selectedVendedorModal.boletos}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Comisión Ganada</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                  ${selectedVendedorModal.comision.toFixed(2)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-rose-500">Premios en Punto</span>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
                  ${selectedVendedorModal.premios.toFixed(2)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-500">Balance Neto</span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                  ${selectedVendedorModal.balanceNeto.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Números Más Vendidos por este Vendedor */}
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                Números con Mayor Demanda en su Punto
              </span>
              {selectedVendedorModal.jugadasMasVendidas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedVendedorModal.jugadasMasVendidas.map((j, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 text-xs font-mono font-bold"
                    >
                      {j}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No hay apuestas registradas en el período seleccionado.</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedVendedorModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Detalle de Métrica / Drill-down (Al hacer clic en tarjetas de KPI) */}
      {selectedKpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Desglose: {selectedKpiModal.toUpperCase()}
              </h3>
              <button
                onClick={() => setSelectedKpiModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                Rango seleccionado: <strong className="text-slate-900 dark:text-white">{dateRange.desde} al {dateRange.hasta}</strong> ({dateRange.label || 'Personalizado'}).
              </p>
              
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>Recaudación Total:</span>
                  <strong className="text-slate-900 dark:text-white">${ventaTotal.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-rose-500">
                  <span>(-) Premios Pagados:</span>
                  <strong>${premiosPagados.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-amber-500">
                  <span>(-) Comisiones de Venta (10%):</span>
                  <strong>${comisionesTotal.toFixed(2)}</strong>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-1 flex justify-between text-emerald-600 font-bold">
                  <span>(=) Utilidad Neta de la Casa:</span>
                  <span>${utilidadNeta.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedKpiModal(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
