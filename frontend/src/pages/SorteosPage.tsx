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
  Calendar,
  Edit3
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

  // Modal: Editar Sorteo
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSorteo, setSelectedSorteo] = useState<Sorteo | null>(null);
  const [editHoraCierre, setEditHoraCierre] = useState('');
  const [editEstado, setEditEstado] = useState('ABIERTO');

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
    const interval = setInterval(loadData, 30000);
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
        setSuccessMessage(`Los turnos del día para ${selectedFecha} ya estaban generados.`);
      }
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al generar los sorteos automáticos del día.');
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
      const fechaHoraString = `${selectedFecha}T${modalHora}`;
      const horaCierre = new Date(fechaHoraString).toISOString();

      await api.post('/sorteos', {
        fecha: selectedFecha,
        horaCierre: horaCierre,
        zonaId: modalZonaId === 'all' ? null : Number(modalZonaId),
        horarioConfiguracionId: null
      });

      setSuccessMessage('Sorteo extraordinario creado exitosamente.');
      setIsModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Error al programar el sorteo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (sorteo: Sorteo) => {
    setSelectedSorteo(sorteo);
    const dateObj = new Date(sorteo.horaCierre);
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    setEditHoraCierre(`${hours}:${minutes}`);
    setEditEstado(sorteo.estado);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSorteo) return;
    try {
      setIsSaving(true);
      await api.patch(`/sorteos/${selectedSorteo.id}/estado`, {
        nuevoEstado: editEstado
      });

      setSuccessMessage(`Sorteo ${selectedSorteo.codigo} actualizado correctamente.`);
      setIsEditModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar el sorteo.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCambiarEstado = async (sorteoId: number, nuevoEstado: string) => {
    try {
      await api.patch(`/sorteos/${sorteoId}/estado`, {
        nuevoEstado
      });
      setSuccessMessage(`Estado del sorteo actualizado a: ${nuevoEstado}`);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('No se pudo cambiar el estado del sorteo.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const getEstadoBadge = (s: Sorteo) => {
    if (s.estado === 'LIQUIDADO') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Liquidado (Ganador: {s.numeroGanador})
        </span>
      );
    }
    if (s.estado === 'CERRADO_PENDIENTE_GANADOR') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Esperando Ganador
        </span>
      );
    }
    if (s.estado === 'BLOQUEADO_VENTA' || !s.permiteVenta) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Ventas Bloqueadas
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30 flex items-center gap-1">
        <PlayCircle className="w-3 h-3" />
        Venta Abierta ({s.minutosRestantesVenta} min restantes)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <CalendarClock className="w-4 h-4" />
            Programación y Reglas de Horarios
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Programación de Sorteos</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Control de turnos diarios. Los sorteos se generan automáticamente y las ventas se bloquean antes del cierre del sorteo.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleGenerarDia}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generar Turnos del Día
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Manual
          </button>
        </div>
      </div>

      {/* Date Quick Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider">Fecha Seleccionada:</span>
          <input
            type="date"
            value={selectedFecha}
            onChange={(e) => setSelectedFecha(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          <button
            onClick={() => setSelectedFecha(new Date().toISOString().split('T')[0])}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setSelectedFecha(d.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
          >
            Mañana
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Sorteos Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-slate-500 dark:text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold">Sincronizando sorteos...</span>
        </div>
      ) : sorteos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <CalendarClock className="w-12 h-12 text-slate-400 mb-3" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">No hay sorteos programados para {selectedFecha}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Haz clic en "Generar Turnos del Día" para programar los horarios oficiales activos.
          </p>
          <button
            onClick={handleGenerarDia}
            disabled={isGenerating}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
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
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">{sorteo.codigo}</span>
                    <button
                      onClick={() => handleOpenEdit(sorteo)}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded transition-colors"
                      title="Editar Sorteo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{horaFormatted}</h3>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{sorteo.horarioNombre || 'Extraordinario'}</span>
                  </div>

                  <div className="mb-4">
                    {getEstadoBadge(sorteo)}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  {sorteo.estado === 'ABIERTO' && (
                    <button
                      onClick={() => handleCambiarEstado(sorteo.id, 'BLOQUEADO_VENTA')}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Lock className="w-3 h-3" />
                      Forzar Bloqueo
                    </button>
                  )}
                  {sorteo.estado === 'BLOQUEADO_VENTA' && (
                    <button
                      onClick={() => handleCambiarEstado(sorteo.id, 'ABIERTO')}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <PlayCircle className="w-3 h-3" />
                      Reabrir Venta
                    </button>
                  )}
                  {sorteo.estado === 'CERRADO_PENDIENTE_GANADOR' && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-300 font-mono">Pendiente Liquidación</span>
                  )}
                  {sorteo.estado === 'LIQUIDADO' && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Ganador: #{sorteo.numeroGanador}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Horarios Oficiales Info Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Horarios Predefinidos del Sistema</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {horarios.map(h => (
            <div key={h.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="font-black text-sm text-slate-900 dark:text-white block">{h.horaCierre.slice(0, 5)}</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block truncate">{h.nombre}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Bloqueo: -{h.minutosBloqueoPrevio} min</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Crear Sorteo Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Programar Sorteo Manual</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateManual} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Hora de Cierre
                </label>
                <input
                  type="time"
                  step="1"
                  value={modalHora}
                  onChange={(e) => setModalHora(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Zona / Sucursal
                </label>
                <select
                  value={modalZonaId}
                  onChange={(e) => setModalZonaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="all">Todas las Zonas (Global)</option>
                  {zonas.map(z => (
                    <option key={z.id} value={z.id}>{z.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Programar Sorteo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Sorteo */}
      {isEditModalOpen && selectedSorteo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Editar Sorteo: {selectedSorteo.codigo}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Hora de Cierre
                </label>
                <input
                  type="time"
                  value={editHoraCierre}
                  onChange={(e) => setEditHoraCierre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Estado Operativo
                </label>
                <select
                  value={editEstado}
                  onChange={(e) => setEditEstado(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="ABIERTO">ABIERTO (Permite ventas)</option>
                  <option value="BLOQUEADO_VENTA">BLOQUEADO_VENTA (Congelado)</option>
                  <option value="CANCELADO">CANCELADO (No se juega)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
