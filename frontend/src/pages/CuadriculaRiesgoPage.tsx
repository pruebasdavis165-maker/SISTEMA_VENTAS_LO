import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CuadriculaRiesgoGlobal, NumeroCuadricula } from '../types/riesgo';
import { Sorteo } from '../types/sorteos';
import { Zona } from '../types/zonas';
import { 
  ShieldAlert, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Filter,
  CheckCircle,
  X
} from 'lucide-react';

export const CuadriculaRiesgoPage: React.FC = () => {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState<number | null>(null);
  const [zonaFiltro, setZonaFiltro] = useState<number | ''>('');
  const [cuadriculaData, setCuadriculaData] = useState<CuadriculaRiesgoGlobal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal para Bloquear / Desbloquear Número
  const [numeroModal, setNumeroModal] = useState<NumeroCuadricula | null>(null);
  const [modalAlcance, setModalAlcance] = useState<'GLOBAL' | 'POR_ZONA' | 'POR_VENDEDOR'>('GLOBAL');
  const [modalZonaId, setModalZonaId] = useState<number | ''>('');
  const [modalMotivo, setModalMotivo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    cargarSorteosYZonas();
  }, []);

  useEffect(() => {
    if (sorteoSeleccionado) {
      cargarCuadricula(sorteoSeleccionado, zonaFiltro ? Number(zonaFiltro) : undefined);
    }
  }, [sorteoSeleccionado, zonaFiltro]);

  const cargarSorteosYZonas = async () => {
    try {
      const [resSorteos, resZonas] = await Promise.all([
        api.get<Sorteo[]>('/sorteos'),
        api.get<Zona[]>('/zonas')
      ]);
      setSorteos(resSorteos.data);
      setZonas(resZonas.data);
      if (resSorteos.data.length > 0) {
        const abierto = resSorteos.data.find(s => s.estado === 'ABIERTO') || resSorteos.data[0];
        setSorteoSeleccionado(abierto.id);
      }
    } catch {
      setError('No se pudo cargar la lista de sorteos o zonas.');
    }
  };

  const cargarCuadricula = async (sorteoId: number, zId?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (zId) params.zonaId = zId;

      const res = await api.get<CuadriculaRiesgoGlobal>(`/sorteos/${sorteoId}/cuadricula-global`, { params });
      setCuadriculaData(res.data);
    } catch {
      setError('Error al consultar la cuadrícula de riesgo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (celda: NumeroCuadricula) => {
    setNumeroModal(celda);
    setModalAlcance('GLOBAL');
    setModalZonaId(zonaFiltro || '');
    setModalMotivo(celda.motivoBloqueo || 'Excedente de riesgo acumulado');
  };

  const handleBloquearNumero = async () => {
    if (!sorteoSeleccionado || !numeroModal) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/sorteos/${sorteoSeleccionado}/bloquear-numero`, {
        numero: numeroModal.numero,
        alcance: modalAlcance,
        zonaId: modalAlcance === 'POR_ZONA' && modalZonaId ? Number(modalZonaId) : undefined,
        motivo: modalMotivo
      });

      setMensajeExito(`Número ${numeroModal.numero} bloqueado exitosamente.`);
      setNumeroModal(null);
      await cargarCuadricula(sorteoSeleccionado, zonaFiltro ? Number(zonaFiltro) : undefined);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo bloquear el número.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDesbloquearNumero = async (numero: string) => {
    if (!sorteoSeleccionado) return;
    if (!confirm(`¿Estás seguro de desbloquear el número ${numero}? Podrán recibirse más apuestas.`)) return;

    setActionLoading(true);
    setError(null);
    try {
      await api.delete(`/sorteos/${sorteoSeleccionado}/desbloquear-numero/${numero}`);
      setMensajeExito(`Número ${numero} desbloqueado exitosamente.`);
      setNumeroModal(null);
      await cargarCuadricula(sorteoSeleccionado, zonaFiltro ? Number(zonaFiltro) : undefined);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo desbloquear el número.');
    } finally {
      setActionLoading(false);
    }
  };

  const getHeatClass = (totalVendido: number, maxVenta: number, estaBloqueado: boolean) => {
    if (estaBloqueado) {
      return 'bg-red-100 dark:bg-red-950/70 border-red-500 text-red-700 dark:text-red-300 font-bold';
    }
    if (totalVendido === 0) {
      return 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-400';
    }

    const ratio = maxVenta > 0 ? totalVendido / maxVenta : 0;
    if (ratio > 0.75) {
      return 'bg-amber-100 dark:bg-amber-950/70 border-amber-500 text-amber-800 dark:text-amber-200 font-bold';
    }
    if (ratio > 0.40) {
      return 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-400 text-yellow-800 dark:text-yellow-200';
    }
    return 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-800 dark:text-emerald-200';
  };

  const maxVenta = cuadriculaData?.cuadricula.reduce((max, c) => Math.max(max, c.totalVendido), 0) || 0;

  // Segmentación en 4 columnas estrictas: 00-24, 25-49, 50-74, 75-99
  const columna1 = cuadriculaData?.cuadricula.slice(0, 25) || [];
  const columna2 = cuadriculaData?.cuadricula.slice(25, 50) || [];
  const columna3 = cuadriculaData?.cuadricula.slice(50, 75) || [];
  const columna4 = cuadriculaData?.cuadricula.slice(75, 100) || [];

  const columnas = [
    { titulo: 'Columna 1 (00 - 24)', celdas: columna1 },
    { titulo: 'Columna 2 (25 - 49)', celdas: columna2 },
    { titulo: 'Columna 3 (50 - 74)', celdas: columna3 },
    { titulo: 'Columna 4 (75 - 99)', celdas: columna4 },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Matriz de Control de Riesgo Financiero (00-99)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
            Visualización en tiempo real del dinero acumulado por número y panel de bloqueo preventivo de jugadas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => sorteoSeleccionado && cargarCuadricula(sorteoSeleccionado, zonaFiltro ? Number(zonaFiltro) : undefined)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors text-xs font-bold shadow-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar Riesgo
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {mensajeExito && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filtros de Control con Selects estilizados */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sorteo:</span>
            <select
              value={sorteoSeleccionado || ''}
              onChange={(e) => setSorteoSeleccionado(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            >
              {sorteos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo} - {s.fecha} ({s.estado})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Zona:</span>
            <select
              value={zonaFiltro}
              onChange={(e) => setZonaFiltro(e.target.value ? Number(e.target.value) : '')}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todas las Zonas (Consolidado Global)</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Leyenda de Calor */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 inline-block" /> Sin Ventas
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 inline-block" /> Bajo
          </span>
          <span className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
            <span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-950/60 border border-yellow-400 inline-block" /> Medio
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-500 inline-block" /> Alto
          </span>
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-950/60 border border-red-500 inline-block" /> Bloqueado
          </span>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero de Riesgo */}
      {cuadriculaData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Venta Total Sorteo</span>
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ${cuadriculaData.ventaTotalAcumulada.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dinero recaudado hasta el momento</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Riesgo Máximo a Pagar</span>
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              ${cuadriculaData.riesgoTotalEstimado.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Suma global si todos premiaran</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Número de Mayor Riesgo</span>
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {cuadriculaData.cuadricula.reduce((top, cur) => cur.totalVendido > top.totalVendido ? cur : top).numero}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Vendido: ${maxVenta.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Números Bloqueados</span>
              <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400">
              {cuadriculaData.cuadricula.filter(c => c.estaBloqueado).length} / 100
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Límite o corte de venta alcanzado</p>
          </div>
        </div>
      )}

      {/* Cuadrícula Dividida en 4 Columnas (00-24, 25-49, 50-74, 75-99) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Cuadrícula 00 - 99 Dividida en 4 Columnas
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Haz clic en un número para bloquear o desbloquear</span>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : cuadriculaData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {columnas.map((col, colIdx) => (
              <div key={colIdx} className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3 text-center uppercase tracking-wider">
                  {col.titulo}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {col.celdas.map((celda) => (
                    <button
                      key={celda.numero}
                      onClick={() => handleOpenModal(celda)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all hover:scale-105 active:scale-95 ${getHeatClass(
                        celda.totalVendido,
                        maxVenta,
                        celda.estaBloqueado
                      )}`}
                    >
                      <div className="flex items-center gap-0.5">
                        <span className="text-sm font-mono font-black">{celda.numero}</span>
                        {celda.estaBloqueado && <Lock className="w-3 h-3 text-red-500 shrink-0" />}
                      </div>
                      <div className="text-[10px] mt-0.5 font-medium tracking-tight">
                        ${celda.totalVendido.toFixed(0)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Modal de Detalle y Bloqueo de Número */}
      {numeroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-indigo-200 dark:border-slate-700">
                  {numeroModal.numero}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Detalle de Riesgo</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Posición de jugada</p>
                </div>
              </div>
              <button
                onClick={() => setNumeroModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Estadísticas de la posición */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total Vendido</span>
                <span className="font-bold text-slate-900 dark:text-white">${numeroModal.totalVendido.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Jugadas Registradas</span>
                <span className="font-bold text-slate-900 dark:text-white">{numeroModal.cantidadJugadas} jugadas</span>
              </div>
              <div className="col-span-2 border-t border-slate-200 dark:border-slate-800 pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Riesgo Estimado de Premio</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">${numeroModal.riesgoEstimadoPremio.toFixed(2)}</span>
              </div>
            </div>

            {/* Estado de Bloqueo */}
            {numeroModal.estaBloqueado ? (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold text-xs">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Este número se encuentra actualmente BLOQUEADO</span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-300">
                  Motivo: {numeroModal.motivoBloqueo || 'Límite de riesgo superado'}
                </p>
                <button
                  type="button"
                  onClick={() => handleDesbloquearNumero(numeroModal.numero)}
                  disabled={actionLoading}
                  className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
                >
                  {actionLoading ? 'Procesando...' : 'Desbloquear Venta para este Número'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Alcance del Bloqueo
                  </label>
                  <select
                    value={modalAlcance}
                    onChange={(e: any) => setModalAlcance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="GLOBAL">Bloqueo Global (Todas las Zonas)</option>
                    <option value="POR_ZONA">Bloquear Solo en una Zona Específica</option>
                  </select>
                </div>

                {modalAlcance === 'POR_ZONA' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                      Seleccionar Zona
                    </label>
                    <select
                      value={modalZonaId}
                      onChange={(e) => setModalZonaId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Selecciona una zona...</option>
                      {zonas.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Motivo Preventivo
                  </label>
                  <input
                    type="text"
                    value={modalMotivo}
                    onChange={(e) => setModalMotivo(e.target.value)}
                    placeholder="Ej. Tope comercial alcanzado"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleBloquearNumero}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
                >
                  {actionLoading ? 'Bloqueando...' : `Bloquear Número ${numeroModal.numero}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
