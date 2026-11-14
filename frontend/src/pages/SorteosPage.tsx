import React, { useEffect, useState } from 'react';
import { 
  CalendarClock, 
  Plus, 
  PlayCircle, 
  Lock, 
  CheckCircle2, 
  Loader2, 
  Clock, 
  X,
  Sparkles,
  Calendar,
  Edit3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { Sorteo, HorarioConfiguracion } from '../types/sorteos';
import { useToastStore } from '../store/useToastStore';
import { CustomSelect } from '../components/common/CustomSelect';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const SorteosPage: React.FC = () => {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [horarios, setHorarios] = useState<HorarioConfiguracion[]>([]);
  const [selectedFecha, setSelectedFecha] = useState(() => getLocalDateString());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Toast
  const toast = useToastStore();

  // Modal: Crear Sorteo Manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalHora, setModalHora] = useState('11:00:00');
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
      const [resSorteos, resHorarios] = await Promise.all([
        api.get<Sorteo[]>(`/sorteos?fecha=${selectedFecha}`),
        api.get<HorarioConfiguracion[]>('/sorteos/horarios')
      ]);
      setSorteos(resSorteos.data);
      setHorarios(resHorarios.data);
    } catch {
      toast.error('Error al sincronizar sorteos y horarios del servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedFecha]);

  const changeDateBy = (days: number) => {
    const parts = selectedFecha.split('-');
    const current = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    current.setDate(current.getDate() + days);
    setSelectedFecha(getLocalDateString(current));
  };

  const handleGenerarDia = async () => {
    try {
      setIsGenerating(true);
      const res = await api.post<Sorteo[]>('/sorteos/generar-dia', {
        fecha: selectedFecha,
        zonaId: null
      });

      if (res.data.length > 0) {
        toast.success(`Se generaron ${res.data.length} sorteos oficiales para la fecha ${selectedFecha}.`);
      } else {
        toast.info(`Los turnos oficiales para ${selectedFecha} ya se encuentran generados.`);
      }
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al generar los sorteos automáticos.');
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
        horaCierre,
        zonaId: null,
        minutosBloqueoAntes: 5
      });

      toast.success('Sorteo extraordinario creado exitosamente.');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'No se pudo crear el sorteo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (s: Sorteo) => {
    setSelectedSorteo(s);
    try {
      const d = new Date(s.horaCierre);
      const timeStr = d.toTimeString().substring(0, 5);
      setEditHoraCierre(timeStr);
    } catch {
      setEditHoraCierre('11:00');
    }
    setEditEstado(s.estado);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSorteo) return;

    try {
      setIsSaving(true);
      const isoHoraCierre = new Date(`${selectedFecha}T${editHoraCierre}:00`).toISOString();

      await api.put(`/sorteos/${selectedSorteo.id}`, {
        horaCierre: isoHoraCierre,
        estado: editEstado
      });

      toast.success('Configuración del sorteo actualizada exitosamente.');
      setIsEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'No se pudo editar el sorteo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCambiarEstado = async (sorteoId: number, nuevoEstado: string) => {
    try {
      await api.patch(`/sorteos/${sorteoId}/estado`, {
        nuevoEstado
      });
      toast.success(`Estado del sorteo actualizado a: ${nuevoEstado}`);
      await loadData();
    } catch {
      toast.error('No se pudo cambiar el estado del sorteo.');
    }
  };

  const formatHoraSorteo = (horaIso: string) => {
    if (!horaIso) return '--:--';
    const d = new Date(horaIso);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return horaIso;
  };

  const getDisplayHoraYNombre = (sorteo: Sorteo) => {
    let horaStr = formatHoraSorteo(sorteo.horaCierre);
    let nombre = sorteo.horarioNombre || 'Extraordinario';
    const match = nombre.match(/\s*\(([^)]+)\)/);
    if (match) {
      horaStr = match[1];
      nombre = nombre.replace(/\s*\([^)]+\)/, '').trim();
    }
    return { horaStr, nombre };
  };

  const getEstadoBadge = (s: Sorteo) => {
    if (s.estado === 'LIQUIDADO') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Liquidado (Ganador: <strong className="font-mono">{s.numeroGanador}</strong>)
        </span>
      );
    }
    if (s.estado === 'CERRADO_PENDIENTE_GANADOR') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Cerrado (Esperando Ganador)
        </span>
      );
    }
    if (s.estado === 'BLOQUEADO_VENTA' || !s.permiteVenta) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" />
          Ventas Bloqueadas
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30 flex items-center gap-1">
        <PlayCircle className="w-3.5 h-3.5" />
        Venta Abierta ({s.minutosRestantesVenta} min restantes)
      </span>
    );
  };

  const estadoSelectOptions = [
    { value: 'ABIERTO', label: 'ABIERTO (Permite ventas)' },
    { value: 'BLOQUEADO_VENTA', label: 'BLOQUEADO (Cierre temporal)' },
    { value: 'CERRADO_PENDIENTE_GANADOR', label: 'CERRADO (Esperando Ganador)' },
    { value: 'CANCELADO', label: 'CANCELADO' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Programación de Sorteos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generación diaria, control de horarios oficiales de cierre y bloqueo automático de ventas
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            onClick={handleGenerarDia}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generar Turnos del Día
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Extraordinario
          </button>
        </div>
      </div>

      {/* Date Navigator Bar con UI/UX mejorada */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => changeDateBy(-1)}
              title="Día Anterior"
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <input
                type="date"
                value={selectedFecha}
                onChange={(e) => setSelectedFecha(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none font-bold font-mono cursor-pointer"
              />
            </div>
            <button
              onClick={() => changeDateBy(1)}
              title="Día Siguiente"
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-semibold">
          {(() => {
            const today = new Date();
            const ayer = new Date(today);
            ayer.setDate(today.getDate() - 1);
            const manana = new Date(today);
            manana.setDate(today.getDate() + 1);

            const hoyStr = getLocalDateString(today);
            const ayerStr = getLocalDateString(ayer);
            const mananaStr = getLocalDateString(manana);

            const isAyer = selectedFecha === ayerStr;
            const isHoy = selectedFecha === hoyStr;
            const isManana = selectedFecha === mananaStr;

            return (
              <>
                <button
                  onClick={() => setSelectedFecha(ayerStr)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isAyer
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm'
                      : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Ayer
                </button>
                <button
                  onClick={() => setSelectedFecha(hoyStr)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isHoy
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm'
                      : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setSelectedFecha(mananaStr)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isManana
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm'
                      : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Mañana
                </button>
              </>
            );
          })()}
        </div>
      </div>

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
            className="mt-4 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Generar Sorteos Oficiales
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sorteos.map((sorteo) => {
            const { horaStr, nombre } = getDisplayHoraYNombre(sorteo);
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
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded transition-colors cursor-pointer"
                      title="Editar Sorteo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">{horaStr}</h3>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{nombre}</span>
                  </div>

                  <div className="mb-4">
                    {getEstadoBadge(sorteo)}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  {sorteo.estado === 'ABIERTO' && (
                    <button
                      onClick={() => handleCambiarEstado(sorteo.id, 'BLOQUEADO_VENTA')}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      Forzar Bloqueo
                    </button>
                  )}
                  {sorteo.estado === 'BLOQUEADO_VENTA' && (
                    <button
                      onClick={() => handleCambiarEstado(sorteo.id, 'ABIERTO')}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <PlayCircle className="w-3 h-3" />
                      Reabrir Ventas
                    </button>
                  )}
                  {sorteo.estado === 'CERRADO_PENDIENTE_GANADOR' && (
                    <span className="text-[11px] text-slate-400 italic">Listo para liquidar</span>
                  )}
                  {sorteo.estado === 'LIQUIDADO' && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Oficializado</span>
                  )}

                  <span className="text-[10px] text-slate-400 font-mono">
                    Tope: 5 min antes
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reglas de Horarios Diarios */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
          Horarios Oficiales Registrados
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {horarios.map((h) => (
            <div key={h.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{h.nombre}</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">{h.horaCierre.substring(0, 5)}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                h.activo 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {h.activo ? 'ACTIVO' : 'PAUSADO'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Editar Sorteo */}
      {isEditModalOpen && selectedSorteo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Editar Sorteo #{selectedSorteo.codigo}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Hora de Cierre Oficial
                </label>
                <input
                  type="time"
                  value={editHoraCierre}
                  onChange={(e) => setEditHoraCierre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Estado Operativo
                </label>
                <CustomSelect
                  options={estadoSelectOptions}
                  value={editEstado}
                  onChange={(val) => setEditEstado(val)}
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Sorteo Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Programar Sorteo Extraordinario
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                {modalError}
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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
