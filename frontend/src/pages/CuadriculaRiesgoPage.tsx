import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CuadriculaRiesgoGlobal, NumeroCuadricula } from '../types/riesgo';
import { Sorteo } from '../types/sorteos';
import { Zona } from '../types/zonas';
import { 
  ShieldAlert, 
  Lock, 
  Unlock,
  RefreshCw, 
  DollarSign, 
  Layers,
  Award,
  Loader2,
  X
} from 'lucide-react';
import { CustomSelect } from '../components/common/CustomSelect';
import { useToastStore } from '../store/useToastStore';

export const CuadriculaRiesgoPage: React.FC = () => {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState<number | null>(null);
  const [zonaFiltro, setZonaFiltro] = useState<string>('all');
  const [cuadriculaData, setCuadriculaData] = useState<CuadriculaRiesgoGlobal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Toast
  const toast = useToastStore();

  // Modal para Bloquear / Desbloquear Número
  const [numeroModal, setNumeroModal] = useState<NumeroCuadricula | null>(null);
  const [modalAlcance, setModalAlcance] = useState<'GLOBAL' | 'POR_ZONA' | 'POR_VENDEDOR'>('GLOBAL');
  const [modalZonaId, setModalZonaId] = useState<string>('');
  const [modalMotivo, setModalMotivo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    cargarSorteosYZonas();
  }, []);

  useEffect(() => {
    if (sorteoSeleccionado) {
      cargarCuadricula(sorteoSeleccionado, zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined);
    }
  }, [sorteoSeleccionado, zonaFiltro]);

  const cargarSorteosYZonas = async () => {
    try {
      const [resSorteos, resZonas] = await Promise.all([
        api.get<Sorteo[]>('/sorteos'),
        api.get<Zona[]>('/zonas?soloActivas=true')
      ]);
      setSorteos(resSorteos.data);
      setZonas(resZonas.data);
      if (resSorteos.data.length > 0) {
        const abierto = resSorteos.data.find(s => s.estado === 'ABIERTO') || resSorteos.data[0];
        setSorteoSeleccionado(abierto.id);
      }
    } catch {
      toast.error('No se pudo cargar la lista de sorteos o zonas.');
    }
  };

  const cargarCuadricula = async (sorteoId: number, zId?: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (zId) params.zonaId = zId;

      const res = await api.get<CuadriculaRiesgoGlobal>(`/sorteos/${sorteoId}/cuadricula-global`, { params });
      setCuadriculaData(res.data);
    } catch {
      toast.error('Error al consultar la cuadrícula de riesgo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (celda: NumeroCuadricula) => {
    setNumeroModal(celda);
    setModalAlcance('GLOBAL');
    setModalZonaId(zonaFiltro !== 'all' ? zonaFiltro : (zonas[0]?.id.toString() || ''));
    setModalMotivo(celda.motivoBloqueo || 'Tope de riesgo preventivo');
  };

  const handleBloquearNumero = async () => {
    if (!sorteoSeleccionado || !numeroModal) return;
    setActionLoading(true);
    try {
      await api.post(`/sorteos/${sorteoSeleccionado}/bloquear-numero`, {
        numero: numeroModal.numero,
        alcance: modalAlcance,
        zonaId: modalAlcance === 'POR_ZONA' && modalZonaId ? Number(modalZonaId) : undefined,
        motivo: modalMotivo
      });

      toast.success(`Número #${numeroModal.numero} bloqueado exitosamente.`);
      setNumeroModal(null);
      await cargarCuadricula(sorteoSeleccionado, zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'No se pudo bloquear el número.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDesbloquearNumero = async (numero: string) => {
    if (!sorteoSeleccionado) return;
    setActionLoading(true);
    try {
      await api.delete(`/sorteos/${sorteoSeleccionado}/bloquear-numero/${numero}`);
      toast.success(`Número #${numero} desbloqueado exitosamente.`);
      setNumeroModal(null);
      await cargarCuadricula(sorteoSeleccionado, zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'No se pudo desbloquear el número.');
    } finally {
      setActionLoading(false);
    }
  };

  // Generar datos 00 a 99 si no han llegado aún del backend
  const celdasMap = new Map<string, NumeroCuadricula>();
  if (cuadriculaData?.cuadricula) {
    cuadriculaData.cuadricula.forEach(n => celdasMap.set(n.numero, n));
  }

  const todasLasCeldas: NumeroCuadricula[] = [];
  for (let i = 0; i < 100; i++) {
    const numStr = i.toString().padStart(2, '0');
    todasLasCeldas.push(
      celdasMap.get(numStr) || {
        numero: numStr,
        totalVendido: 0,
        cantidadJugadas: 0,
        riesgoEstimadoPremio: 0,
        estaBloqueado: false
      }
    );
  }

  // Segmentación exacta de 4 columnas x 25 filas
  const col1 = todasLasCeldas.slice(0, 25);   // 00 - 24
  const col2 = todasLasCeldas.slice(25, 50);  // 25 - 49
  const col3 = todasLasCeldas.slice(50, 75);  // 50 - 74
  const col4 = todasLasCeldas.slice(75, 100); // 75 - 99

  const columnas = [
    { titulo: '00 al 24', rango: '00 - 24', celdas: col1 },
    { titulo: '25 al 49', rango: '25 - 49', celdas: col2 },
    { titulo: '50 al 74', rango: '50 - 74', celdas: col3 },
    { titulo: '75 al 99', rango: '75 - 99', celdas: col4 },
  ];

  const sorteoOptions = sorteos.map((s) => ({
    value: s.id,
    label: `${s.codigo} - ${s.horarioNombre || 'Sorteo'}`,
    sublabel: s.estado
  }));

  const zonaOptions = [
    { value: 'all', label: 'Todas las Zonas (Consolidado)' },
    ...zonas.map((z) => ({ value: z.id.toString(), label: z.nombre, sublabel: `x${Number(z.coeficientePremio).toFixed(2)}` }))
  ];

  const numeroMasJugadoObj = cuadriculaData?.cuadricula?.length
    ? cuadriculaData.cuadricula.reduce((prev, curr) => curr.totalVendido > prev.totalVendido ? curr : prev, cuadriculaData.cuadricula[0])
    : null;

  const totalBloqueados = cuadriculaData?.cuadricula?.filter(c => c.estaBloqueado).length || 0;

  return (
    <div className="space-y-6">
      {/* 1. Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Cuadrícula de Riesgo 00-99
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoreo en tiempo real de apuestas acumuladas por número y corte preventivo de ventas
          </p>
        </div>

        <button
          onClick={() => sorteoSeleccionado && cargarCuadricula(sorteoSeleccionado, zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors text-xs font-bold shadow-sm cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar Riesgo
        </button>
      </div>

      {/* 2. Tarjetas de Métricas (KPIs) - ESTÁN ARRIBA DE LOS FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Apostado</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ${cuadriculaData?.ventaTotalAcumulada?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Acumulado en este sorteo</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exposición Máxima</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              ${cuadriculaData?.riesgoTotalEstimado?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Premio potencial más alto</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Número Más Jugado</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              #{numeroMasJugadoObj?.numero || '--'}
            </h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              ${numeroMasJugadoObj?.totalVendido?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Números Bloqueados</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalBloqueados} / 100
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Cortes de venta activos</span>
          </div>
        </div>
      </div>

      {/* 3. Filtros de Control - ESTÁN POR DEBAJO DE LAS MÉTRICAS */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-64">
            <CustomSelect
              options={sorteoOptions}
              value={sorteoSeleccionado || ''}
              onChange={(val) => setSorteoSeleccionado(Number(val))}
              placeholder="Seleccionar Sorteo"
            />
          </div>

          <div className="w-full sm:w-64">
            <CustomSelect
              options={zonaOptions}
              value={zonaFiltro}
              onChange={(val) => setZonaFiltro(val)}
              placeholder="Filtrar por Zona"
            />
          </div>
        </div>

        {/* Leyenda de Riesgo */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" /> Sin Apuesta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Bajo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Medio
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Alto / Tope
          </span>
          <span className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
            <Lock className="w-3 h-3" /> Bloqueado
          </span>
        </div>
      </div>

      {/* 4. Cuadrícula de 4 Columnas x 25 Filas */}
      {isLoading ? (
        <div className="flex items-center justify-center p-20 text-slate-500 dark:text-slate-400 gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold">Calculando matriz de riesgo...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columnas.map((col, cIdx) => (
            <div key={cIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              {/* Header de Columna */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black tracking-wider uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Columna {cIdx + 1}
                </span>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  {col.rango}
                </span>
              </div>

              {/* 25 Filas Verticales */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
                {col.celdas.map((celda) => {
                  const tieneVenta = celda.totalVendido > 0;
                  const isBloqueado = celda.estaBloqueado;
                  const isHighRisk = celda.totalVendido >= 1000;

                  return (
                    <div
                      key={celda.numero}
                      onClick={() => handleOpenModal(celda)}
                      className={`flex items-center justify-between px-3.5 py-2.5 transition-all cursor-pointer ${
                        isBloqueado
                          ? 'bg-rose-50/70 dark:bg-rose-950/20 hover:bg-rose-100/70 dark:hover:bg-rose-950/40'
                          : isHighRisk
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
                          : tieneVenta
                          ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          : 'opacity-70 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Número Badge */}
                      <div className="flex items-center gap-2.5">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm shrink-0 transition-transform ${
                          isBloqueado
                            ? 'bg-rose-600 text-white'
                            : isHighRisk
                            ? 'bg-amber-500 text-white'
                            : tieneVenta
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {celda.numero}
                        </span>

                        <div>
                          <p className={`font-mono font-bold text-xs ${
                            isBloqueado
                              ? 'text-rose-700 dark:text-rose-300'
                              : tieneVenta
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400'
                          }`}>
                            ${celda.totalVendido.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Premio: ${celda.riesgoEstimadoPremio.toFixed(0)}
                          </p>
                        </div>
                      </div>

                      {/* Estado o Bloqueo */}
                      <div>
                        {isBloqueado ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            <Lock className="w-3 h-3" />
                            Bloqueado
                          </span>
                        ) : isHighRisk ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            Tope
                          </span>
                        ) : tieneVenta ? (
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            Activo
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            --
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Bloquear / Desbloquear Número */}
      {numeroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center font-mono">
                  {numeroModal.numero}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Gestión de Riesgo #{numeroModal.numero}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Apostado: <strong className="font-mono text-slate-700 dark:text-slate-300">${numeroModal.totalVendido.toFixed(2)}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNumeroModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {numeroModal.estaBloqueado ? (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Este número se encuentra actualmente bloqueado para ventas.</span>
                  </div>
                  {numeroModal.motivoBloqueo && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Motivo: <em>"{numeroModal.motivoBloqueo}"</em>
                    </p>
                  )}

                  <button
                    onClick={() => handleDesbloquearNumero(numeroModal.numero)}
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                    Desbloquear y Permitir Ventas
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Alcance del Bloqueo
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModalAlcance('GLOBAL')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          modalAlcance === 'GLOBAL'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        Global (Todas las Zonas)
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalAlcance('POR_ZONA')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          modalAlcance === 'POR_ZONA'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        Por Sucursal Específica
                      </button>
                    </div>
                  </div>

                  {modalAlcance === 'POR_ZONA' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Sucursal Afectada
                      </label>
                      <CustomSelect
                        options={zonas.map(z => ({ value: z.id.toString(), label: z.nombre }))}
                        value={modalZonaId}
                        onChange={(val) => setModalZonaId(val)}
                        placeholder="Seleccionar Sucursal"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Motivo del Bloqueo
                    </label>
                    <input
                      type="text"
                      value={modalMotivo}
                      onChange={(e) => setModalMotivo(e.target.value)}
                      placeholder="ej. Tope financiero alcanzado"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setNumeroModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleBloquearNumero}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Confirmar Bloqueo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
