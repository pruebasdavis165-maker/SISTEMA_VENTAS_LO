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

  // Carga inicial de sorteos abiertos/activos y zonas
  useEffect(() => {
    cargarSorteosYZonas();
  }, []);

  // Cargar cuadrícula al cambiar selección
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
        // Seleccionar por defecto el primer sorteo abierto o el primero de la lista
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

      setMensajeExito(`¡Número ${numeroModal.numero} bloqueado exitosamente!`);
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
      setMensajeExito(`¡Número ${numero} desbloqueado exitosamente!`);
      setNumeroModal(null);
      await cargarCuadricula(sorteoSeleccionado, zonaFiltro ? Number(zonaFiltro) : undefined);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo desbloquear el número.');
    } finally {
      setActionLoading(false);
    }
  };

  // Calcular intensidad de calor según ventas
  const getHeatClass = (totalVendido: number, maxVenta: number, estaBloqueado: boolean) => {
    if (estaBloqueado) return 'bg-red-500/20 border-red-500/80 text-red-200';
    if (totalVendido === 0) return 'bg-surface-800/40 border-surface-700/60 text-surface-400 hover:border-brand-500';

    const ratio = maxVenta > 0 ? totalVendido / maxVenta : 0;
    if (ratio > 0.75) return 'bg-amber-500/30 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/10 font-bold';
    if (ratio > 0.40) return 'bg-yellow-500/20 border-yellow-500/60 text-yellow-200';
    return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200';
  };

  const maxVenta = cuadriculaData?.cuadricula.reduce((max, c) => Math.max(max, c.totalVendido), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-brand-500" />
            Matriz de Control de Riesgo Financiero (00-99)
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Visualización en tiempo real del dinero acumulado por número y panel de bloqueo preventivo de jugadas (CU04).
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => sorteoSeleccionado && cargarCuadricula(sorteoSeleccionado, zonaFiltro ? Number(zonaFiltro) : undefined)}
            className="flex items-center gap-2 px-3 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded-lg border border-surface-700 transition-colors text-sm font-medium"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar Riesgo
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-200 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {mensajeExito && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-200 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filtros de Control */}
      <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-surface-400" />
            <span className="text-sm font-medium text-surface-300">Sorteo:</span>
            <select
              value={sorteoSeleccionado || ''}
              onChange={(e) => setSorteoSeleccionado(Number(e.target.value))}
              className="bg-surface-800 border border-surface-700 text-white rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            >
              {sorteos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo} - {s.fecha} ({s.estado})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-surface-300">Zona:</span>
            <select
              value={zonaFiltro}
              onChange={(e) => setZonaFiltro(e.target.value ? Number(e.target.value) : '')}
              className="bg-surface-800 border border-surface-700 text-white rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
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
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-surface-400">
            <span className="w-3 h-3 rounded bg-surface-800 border border-surface-700 inline-block" /> Sin Apuestas
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" /> Bajo Riesgo
          </span>
          <span className="flex items-center gap-1.5 text-yellow-300">
            <span className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/60 inline-block" /> Riesgo Medio
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500 inline-block" /> Alto Riesgo
          </span>
          <span className="flex items-center gap-1.5 text-red-300">
            <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500 inline-block" /> Bloqueado
          </span>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero de Riesgo */}
      {cuadriculaData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl">
            <div className="flex items-center justify-between text-surface-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Venta Total Sorteo</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              ${cuadriculaData.ventaTotalAcumulada.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-surface-400 mt-1">Dinero recaudado hasta el momento</p>
          </div>

          <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl">
            <div className="flex items-center justify-between text-surface-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Riesgo Máximo a Pagar</span>
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">
              ${cuadriculaData.riesgoTotalEstimado.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-surface-400 mt-1">Suma global si todos premiaran</p>
          </div>

          <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl">
            <div className="flex items-center justify-between text-surface-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Número de Mayor Riesgo</span>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {cuadriculaData.cuadricula.reduce((top, cur) => cur.totalVendido > top.totalVendido ? cur : top).numero}
            </div>
            <p className="text-xs text-surface-400 mt-1">
              Vendido: ${maxVenta.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl">
            <div className="flex items-center justify-between text-surface-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Números Bloqueados</span>
              <Lock className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">
              {cuadriculaData.cuadricula.filter(c => c.estaBloqueado).length} / 100
            </div>
            <p className="text-xs text-surface-400 mt-1">Límite o corte de venta alcanzado</p>
          </div>
        </div>
      )}

      {/* Cuadrícula Interactiva 10x10 (00 a 99) */}
      <div className="p-6 bg-surface-900 border border-surface-800 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">
            Matriz de Dígitos 00 al 99 (Haz clic en un número para bloquearlo o ver detalles)
          </h2>
          <span className="text-xs text-surface-400">Total 100 posiciones</span>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : cuadriculaData ? (
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {cuadriculaData.cuadricula.map((celda) => (
              <button
                key={celda.numero}
                onClick={() => handleOpenModal(celda)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all transform hover:scale-105 active:scale-95 ${getHeatClass(
                  celda.totalVendido,
                  maxVenta,
                  celda.estaBloqueado
                )}`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-lg font-mono font-bold">{celda.numero}</span>
                  {celda.estaBloqueado && <Lock className="w-3.5 h-3.5 text-red-400" />}
                </div>
                <div className="text-[10px] mt-1 tracking-tight">
                  ${celda.totalVendido.toFixed(0)}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Modal de Detalle y Bloqueo de Número */}
      {numeroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-extrabold text-brand-400 bg-surface-800 px-3 py-1 rounded-lg border border-surface-700">
                  {numeroModal.numero}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-white">Detalle de Riesgo</h3>
                  <p className="text-xs text-surface-400">Número de sorteo</p>
                </div>
              </div>
              <button
                onClick={() => setNumeroModal(null)}
                className="text-surface-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Estadísticas de la posición */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-surface-950 p-3 rounded-lg border border-surface-800">
              <div>
                <span className="text-xs text-surface-400 block">Total Vendido</span>
                <span className="font-bold text-white">${numeroModal.totalVendido.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-surface-400 block">Apuestas Registradas</span>
                <span className="font-bold text-white">{numeroModal.cantidadJugadas} jugadas</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-surface-400 block">Riesgo Estimado de Premio</span>
                <span className="font-bold text-amber-400">${numeroModal.riesgoEstimadoPremio.toFixed(2)}</span>
              </div>
            </div>

            {/* Estado de Bloqueo */}
            {numeroModal.estaBloqueado ? (
              <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-red-300 font-semibold text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Este número se encuentra actualmente BLOQUEADO</span>
                </div>
                <p className="text-xs text-red-200">
                  Alcance: <strong className="uppercase">{numeroModal.alcanceBloqueo}</strong>
                </p>
                {numeroModal.motivoBloqueo && (
                  <p className="text-xs text-surface-300 italic">"{numeroModal.motivoBloqueo}"</p>
                )}

                <button
                  onClick={() => handleDesbloquearNumero(numeroModal.numero)}
                  disabled={actionLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <Unlock className="w-4 h-4" />
                  Desbloquear y Permitir Ventas
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="text-xs text-surface-400">
                  Aplica un bloqueo para evitar que los vendedores sigan emitiendo tickets con este número en el sorteo.
                </div>

                <div>
                  <label className="text-xs font-medium text-surface-300 block mb-1">Alcance del Bloqueo</label>
                  <select
                    value={modalAlcance}
                    onChange={(e: any) => setModalAlcance(e.target.value)}
                    className="w-full bg-surface-800 border border-surface-700 text-white rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="GLOBAL">GLOBAL (Toda la Empresa y Todas las Zonas)</option>
                    <option value="POR_ZONA">POR ZONA (Específica)</option>
                  </select>
                </div>

                {modalAlcance === 'POR_ZONA' && (
                  <div>
                    <label className="text-xs font-medium text-surface-300 block mb-1">Zona Afectada</label>
                    <select
                      value={modalZonaId}
                      onChange={(e) => setModalZonaId(Number(e.target.value))}
                      className="w-full bg-surface-800 border border-surface-700 text-white rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    >
                      <option value="">Selecciona una zona</option>
                      {zonas.map(z => (
                        <option key={z.id} value={z.id}>{z.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-surface-300 block mb-1">Motivo del Bloqueo</label>
                  <input
                    type="text"
                    value={modalMotivo}
                    onChange={(e) => setModalMotivo(e.target.value)}
                    placeholder="Ej. Tope de riesgo alcanzado"
                    className="w-full bg-surface-800 border border-surface-700 text-white rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleBloquearNumero}
                  disabled={actionLoading || (modalAlcance === 'POR_ZONA' && !modalZonaId)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors mt-2"
                >
                  <Lock className="w-4 h-4" />
                  {actionLoading ? 'Procesando...' : 'Confirmar Bloqueo Preventivo'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
