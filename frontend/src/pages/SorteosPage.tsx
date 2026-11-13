import React, { useEffect, useState } from 'react';
import { 
  CalendarClock, 
  Plus, 
  PlayCircle, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Clock, 
  X,
  Sparkles,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { Sorteo, HorarioConfiguracion } from '../types/sorteos';
import { Zona } from '../types/zonas';

export const SorteosPage: React.FC = () => {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [horarios, setHorarios] = useState<HorarioConfiguracion[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [selectedFecha, setSelectedFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal: Crear Sorteo Manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalHora, setModalHora] = useState('11:00:00');
  const [modalZonaId, setModalZonaId] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [resSorteos, resHorarios, resZonas] = await Promise.all([
        api.get<Sorteo[]>(`/sorteos?fecha=${selectedFecha}`),
        api.get<HorarioConfiguracion[]>('/sorteos/horarios'),
        api.get<Zona[]>('/zonas?soloActivas=true')
      ]);
      setSorteos(resSorteos.data);
      setHorarios(resHorarios.data);
      setZonas(resZonas.data);
    } catch {
      setError('Error al sincronizar sorteos y horarios del servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Polling cada 30 segundos
    return () => clearInterval(interval);
  }, [selectedFecha]);

  const handleGenerarDia = async () => {
    try {
      setIsGenerating(true);
      const res = await api.post<Sorteo[]>('/sorteos/generar-dia', {
        fecha: selectedFecha,
        zonaId: null
      });

      if (res.data.length > 0) {
        setSuccessMessage(`Se generaron ${res.data.length} sorteos oficiales para la fecha ${selectedFecha}.`);
      } else {
        setSuccessMessage(`Los sorteos para la fecha ${selectedFecha} ya estaban previamente generados.`);
      }

      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      setError('Error al autogenerar los sorteos diarios.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    try {
      setIsSaving(true);
      await api.post('/sorteos', {
        fecha: selectedFecha,
        horaCierre: modalHora,
        zonaId: modalZonaId === 'all' ? null : parseInt(modalZonaId),
        horarioConfiguracionId: null
      });

      setSuccessMessage('Sorteo extraordinario creado exitosamente.');
      setIsModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Error al crear el sorteo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCambiarEstado = async (sorteoId: number, nuevoEstado: string) => {
    try {
      await api.patch(`/sorteos/${sorteoId}/estado`, {
        estado: nuevoEstado
      });
      setSuccessMessage(`Estado de sorteo actualizado a ${nuevoEstado}.`);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Error al actualizar el estado del sorteo.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const getEstadoBadge = (s: Sorteo) => {
    if (s.estado === 'LIQUIDADO') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Liquidado (Ganador: {s.numeroGanador})
        </span>
      );
    }
    if (s.estado === 'CERRADO_PENDIENTE_GANADOR') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-1 animate-pulse">
          <Clock className="w-3 h-3" />
          Esperando Ganador
        </span>
      );
    }
    if (s.estado === 'BLOQUEADO_VENTA' || !s.permiteVenta) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Ventas Congeladas (-5m)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center gap-1 animate-pulse">
        <PlayCircle className="w-3 h-3" />
        Venta Abierta ({s.minutosRestantesVenta} min restantes)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <CalendarClock className="w-4 h-4" />
            Programación y Reglas de Tiempo (CU03)
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">Programación de Sorteos</h2>
          <p className="text-xs text-slate-400 mt-1">
            Control de turnos diarios. Las ventas se congelan automáticamente exactamente 5 minutos antes del sorteo.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleGenerarDia}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generar 4 Turnos del Día
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Manual
          </button>
        </div>
      </div>

      {/* Date Quick Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Fecha Seleccionada:</span>
          <input
            type="date"
            value={selectedFecha}
            onChange={(e) => setSelectedFecha(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          <button
            onClick={() => setSelectedFecha(new Date().toISOString().split('T')[0])}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setSelectedFecha(d.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Mañana
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Sorteos Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="text-sm">Sincronizando sorteos...</span>
        </div>
      ) : sorteos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <CalendarClock className="w-12 h-12 text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-white">No hay sorteos programados para {selectedFecha}</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Haz clic en "Generar 4 Turnos del Día" para programar automáticamente los horarios estándar (11 AM, 3 PM, 6 PM, 9 PM).
          </p>
          <button
            onClick={handleGenerarDia}
            disabled={isGenerating}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all"
          >
            Generar Sorteos Oficiales
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sorteos.map((sorteo) => {
            const horaFormatted = new Date(sorteo.horaCierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={sorteo.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{sorteo.codigo}</span>
                    <span className="text-xs font-bold text-indigo-400">{sorteo.zonaNombre || 'Todas las Zonas'}</span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="text-2xl font-black text-white">{horaFormatted}</h3>
                    <span className="text-xs font-semibold text-slate-400">{sorteo.horarioNombre || 'Extraordinario'}</span>
                  </div>

                  <div className="mb-4">
                    {getEstadoBadge(sorteo)}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  {sorteo.estado === 'ABIERTO' && (
                    <button
                      onClick={() => handleCambiarEstado(sorteo.id, 'BLOQUEADO_VENTA')}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Lock className="w-3 h-3" />
                      Forzar Bloqueo
                    </button>
                  )}
                  {sorteo.estado === 'BLOQUEADO_VENTA' && (
                    <button
                      onClick={() => handleCambiarEstado(sorteo.id, 'ABIERTO')}
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <PlayCircle className="w-3 h-3" />
                      Reabrir Venta
                    </button>
                  )}
                  {sorteo.estado === 'CERRADO_PENDIENTE_GANADOR' && (
                    <span className="text-[11px] text-amber-300 font-mono">Pendiente Liquidación</span>
                  )}
                  {sorteo.estado === 'LIQUIDADO' && (
                    <span className="text-[11px] text-emerald-400 font-mono">Ganador: #{sorteo.numeroGanador}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Horarios Oficiales Info Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Horarios Predefinidos del Sistema</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {horarios.map(h => (
            <div key={h.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="font-black text-sm text-white block">{h.horaCierre.slice(0, 5)}</span>
              <span className="text-[11px] text-indigo-400 block truncate">{h.nombre}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Bloqueo: -{h.minutosBloqueoPrevio} min</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Crear Sorteo Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Programar Sorteo Manual</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateManual} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Hora de Cierre</label>
                <input
                  type="time"
                  step="1"
                  value={modalHora}
                  onChange={(e) => setModalHora(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Zona / Sucursal</label>
                <select
                  value={modalZonaId}
                  onChange={(e) => setModalZonaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Todas las Zonas (Global)</option>
                  {zonas.map(z => (
                    <option key={z.id} value={z.id}>{z.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Programar Sorteo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
