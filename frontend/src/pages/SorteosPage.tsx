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
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  History, 
  RefreshCw,
  Trash2 
} from 'lucide-react';
import { api } from '../services/api';
import { Sorteo, HorarioConfiguracion, SorteoDetalle, SorteoHistorial } from '../types/sorteos';
import { useToastStore } from '../store/useToastStore';
import { CustomSelect } from '../components/common/CustomSelect';
import { CustomDatePicker } from '../components/common/CustomDatePicker';
import { CustomDateRangePicker, DateRange } from '../components/common/CustomDateRangePicker';
import { ConfirmModal } from '../components/common/ConfirmModal';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const SorteosPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'turnos' | 'historial'>('turnos');
  
  // Turnos del Día
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [horarios, setHorarios] = useState<HorarioConfiguracion[]>([]);
  const [selectedFecha, setSelectedFecha] = useState(() => getLocalDateString());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Historial de Sorteos
  const [historialSorteos, setHistorialSorteos] = useState<SorteoHistorial[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historialRange, setHistorialRange] = useState<DateRange>(() => {
    const today = new Date();
    const hoyStr = getLocalDateString(today);
    const hace7dias = new Date(today);
    hace7dias.setDate(today.getDate() - 7);
    return {
      desde: getLocalDateString(hace7dias),
      hasta: hoyStr,
      label: 'Últimos 7 días'
    };
  });

  // Modal: Detalle de Sorteo (Al hacer clic en cualquier sorteo)
  const [selectedSorteoDetalle, setSelectedSorteoDetalle] = useState<SorteoDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

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

  // Modal: Crear / Editar Horario Recurrente (Plantilla)
  const [isHorarioModalOpen, setIsHorarioModalOpen] = useState(false);
  const [editingHorarioId, setEditingHorarioId] = useState<number | null>(null);
  const [horarioNombre, setHorarioNombre] = useState('');
  const [horarioHoraCierre, setHorarioHoraCierre] = useState('11:00:00');
  const [horarioMinutosBloqueo, setHorarioMinutosBloqueo] = useState(5);
  const [horarioDiasSemana, setHorarioDiasSemana] = useState('L,M,X,J,V,S,D');
  const [horarioActivo, setHorarioActivo] = useState(true);
  const [savingHorario, setSavingHorario] = useState(false);

  // Modal de Confirmación Estilizado (Reemplazo de window.confirm)
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void>;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Eliminar',
    onConfirm: async () => {},
    isLoading: false,
  });

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

  const loadHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const res = await api.get<SorteoHistorial[]>('/sorteos/historial', {
        params: {
          fechaDesde: historialRange.desde,
          fechaHasta: historialRange.hasta,
        }
      });
      setHistorialSorteos(res.data);
    } catch {
      toast.error('Error al cargar historial de sorteos.');
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'turnos') {
      loadData();
    } else {
      loadHistorial();
    }
  }, [selectedFecha, activeTab, historialRange]);

  const changeDateBy = (days: number) => {
    const parts = selectedFecha.split('-');
    const current = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    current.setDate(current.getDate() + days);
    setSelectedFecha(getLocalDateString(current));
  };

  const handleOpenDetalleSorteo = async (sorteoId: number) => {
    setLoadingDetalle(true);
    setSelectedSorteoDetalle(null);
    try {
      const res = await api.get<SorteoDetalle>(`/sorteos/${sorteoId}/detalle`);
      setSelectedSorteoDetalle(res.data);
    } catch {
      toast.error('No se pudo cargar el detalle del sorteo.');
    } finally {
      setLoadingDetalle(false);
    }
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

  const handleDeleteSorteo = (sorteoId: number) => {
    setConfirmModalState({
      isOpen: true,
      title: '¿Eliminar o Cancelar Sorteo del Día?',
      message: 'Si este sorteo ya cuenta con ventas y boletos emitidos, se pasará a estado CANCELADO para proteger la auditoría contable. Si aún no tiene ventas, se eliminará permanentemente.',
      confirmText: 'Eliminar Sorteo',
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmModalState(prev => ({ ...prev, isLoading: true }));
          const res = await api.delete<{ mensaje: string }>(`/sorteos/${sorteoId}`);
          toast.success(res.data?.mensaje || 'Sorteo procesado exitosamente.');
          setConfirmModalState(prev => ({ ...prev, isOpen: false, isLoading: false }));
          await loadData();
        } catch (err: any) {
          toast.error(err.response?.data?.detail || 'No se pudo eliminar el sorteo.');
          setConfirmModalState(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleOpenCreateHorario = () => {
    setEditingHorarioId(null);
    setHorarioNombre('');
    setHorarioHoraCierre('12:00:00');
    setHorarioMinutosBloqueo(5);
    setHorarioDiasSemana('L,M,X,J,V,S,D');
    setHorarioActivo(true);
    setIsHorarioModalOpen(true);
  };

  const handleOpenEditHorario = (h: HorarioConfiguracion) => {
    setEditingHorarioId(h.id);
    setHorarioNombre(h.nombre);
    setHorarioHoraCierre(h.horaCierre.length === 5 ? `${h.horaCierre}:00` : h.horaCierre);
    setHorarioMinutosBloqueo(h.minutosBloqueoPrevio);
    setHorarioDiasSemana(h.diasSemana || 'L,M,X,J,V,S,D');
    setHorarioActivo(h.activo);
    setIsHorarioModalOpen(true);
  };

  const handleSaveHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!horarioNombre.trim()) {
      toast.error('El nombre del sorteo es obligatorio.');
      return;
    }

    try {
      setSavingHorario(true);
      const payload = {
        nombre: horarioNombre.trim(),
        horaCierre: horarioHoraCierre.length === 5 ? `${horarioHoraCierre}:00` : horarioHoraCierre,
        minutosBloqueoPrevio: Number(horarioMinutosBloqueo) || 5,
        diasSemana: horarioDiasSemana,
        activo: horarioActivo
      };

      if (editingHorarioId) {
        await api.put(`/sorteos/horarios/${editingHorarioId}`, payload);
        toast.success('Turno recurrente actualizado exitosamente.');
      } else {
        await api.post('/sorteos/horarios', payload);
        toast.success('Nuevo turno recurrente creado.');
      }

      setIsHorarioModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al guardar horario.');
    } finally {
      setSavingHorario(false);
    }
  };

  const handleToggleHorario = async (id: number) => {
    try {
      const res = await api.patch<HorarioConfiguracion>(`/sorteos/horarios/${id}/toggle`);
      setHorarios(prev => prev.map(h => h.id === id ? res.data : h));
      toast.success(`Turno ${res.data.activo ? 'activado' : 'desactivado'} para la generación diaria.`);
    } catch {
      toast.error('No se pudo cambiar el estado del horario.');
    }
  };

  const handleDeleteHorario = (id: number, nombre?: string) => {
    setConfirmModalState({
      isOpen: true,
      title: `¿Eliminar Turno Recurrente${nombre ? `: ${nombre}` : ''}?`,
      message: 'Si este horario ya fue utilizado para generar sorteos históricos, quedará DESACTIVADO de forma segura para no afectar registros contables. Si es una plantilla nueva, se borrará definitivamente.',
      confirmText: 'Eliminar Turno',
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmModalState(prev => ({ ...prev, isLoading: true }));
          await api.delete(`/sorteos/horarios/${id}`);
          toast.success('Horario eliminado / desactivado.');
          setConfirmModalState(prev => ({ ...prev, isOpen: false, isLoading: false }));
          await loadData();
        } catch (err: any) {
          toast.error(err.response?.data?.detail || 'No se pudo eliminar el horario.');
          setConfirmModalState(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const formatHoraSorteo = (horaIso: string) => {
    if (!horaIso) return '--:--';
    const d = new Date(horaIso);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return horaIso;
  };

  const getDisplayHoraYNombre = (sorteo: Sorteo | SorteoHistorial) => {
    let horaStr = formatHoraSorteo(sorteo.horaCierre);
    let nombre = sorteo.horarioNombre || 'Extraordinario';
    const match = nombre.match(/\s*\(([^)]+)\)/);
    if (match) {
      horaStr = match[1];
      nombre = nombre.replace(/\s*\([^)]+\)/, '').trim();
    }
    return { horaStr, nombre };
  };

  const getEstadoBadge = (s: Sorteo | SorteoHistorial) => {
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
    if (s.estado === 'BLOQUEADO_VENTA') {
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
        Venta Abierta
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
      {/* 1. Header Bar con Pestañas de Vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Programación y Turnos</h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 ml-3">
              <button
                onClick={() => setActiveTab('turnos')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'turnos'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Turnos del Día
              </button>
              <button
                onClick={() => setActiveTab('historial')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'historial'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Historial de Sorteos
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'turnos'
              ? 'Control de horarios oficiales de cierre y bloqueo automático de ventas'
              : 'Auditoría histórica de recaudación, premios, comisiones y rentabilidad por turno'}
          </p>
        </div>

        {activeTab === 'turnos' && (
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
        )}
      </div>

      {/* 2. Barra de Navegación de Fechas (Para Turnos del Día) */}
      {activeTab === 'turnos' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => changeDateBy(-1)}
              title="Día Anterior"
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Custom Date Picker Estilizado */}
            <div className="w-44">
              <CustomDatePicker
                value={selectedFecha}
                onChange={(f) => setSelectedFecha(f)}
                placeholder="Seleccionar Fecha"
              />
            </div>

            <button
              onClick={() => changeDateBy(1)}
              title="Día Siguiente"
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botones Rápidos de Ayer, Hoy, Mañana con Estado Activo Real */}
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
                    className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
                      isAyer
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm'
                        : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Ayer
                  </button>
                  <button
                    onClick={() => setSelectedFecha(hoyStr)}
                    className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
                      isHoy
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm'
                        : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setSelectedFecha(mananaStr)}
                    className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
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
      )}

      {/* 3. VISTA 1: Grid de Turnos del Día */}
      {activeTab === 'turnos' && (
        <>
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
                    onClick={() => handleOpenDetalleSorteo(sorteo.id)}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between shadow-sm relative overflow-hidden cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">{sorteo.codigo}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(sorteo);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded transition-colors cursor-pointer"
                            title="Editar Sorteo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSorteo(sorteo.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                            title="Eliminar o Cancelar Sorteo del Día"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCambiarEstado(sorteo.id, 'BLOQUEADO_VENTA');
                          }}
                          className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Lock className="w-3 h-3" />
                          Forzar Bloqueo
                        </button>
                      )}
                      {sorteo.estado === 'BLOQUEADO_VENTA' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCambiarEstado(sorteo.id, 'ABIERTO');
                          }}
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

                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                        Ver Detalle &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Plantillas de Turnos Recurrentes (Generación Automática Diaria) */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Plantillas de Turnos Recurrentes (Generación Automática)
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
                  Estos horarios fijos definen qué turnos oficiales se generan automáticamente cada día a las 5:00 AM (y al presionar <strong>"Generar Turnos del Día"</strong>).
                  Puedes activar o desactivar turnos con un solo clic (ej. si hoy no juegan a las 6:00 PM), editar su hora de cierre o agregar nuevos horarios oficiales.
                </p>
              </div>

              <button
                onClick={handleOpenCreateHorario}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Turno Recurrente</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {horarios.map((h) => (
                <div 
                  key={h.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    h.activo 
                      ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 shadow-xs' 
                      : 'bg-slate-100/50 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {h.nombre}
                      </span>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {h.horaCierre.substring(0, 5)}
                      </span>
                    </div>

                    {/* Switch Toggle Activo */}
                    <button
                      type="button"
                      onClick={() => handleToggleHorario(h.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        h.activo ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      title={h.activo ? 'Turno Activo (Se genera automáticamente)' : 'Turno Inactivo (No se generará)'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          h.activo ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2">
                    <div className="flex justify-between">
                      <span>Cierre de ventas:</span>
                      <strong className="text-slate-700 dark:text-slate-300 font-mono">{h.minutosBloqueoPrevio} min antes</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Días activos:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{h.diasSemana || 'L,M,X,J,V,S,D'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span>Estado:</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        h.activo 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {h.activo ? 'ACTIVO' : 'DESACTIVADO'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                    <button
                      onClick={() => handleOpenEditHorario(h)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Editar Horario"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHorario(h.id, h.nombre)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar Horario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 4. VISTA 2: Historial de Sorteos */}
      {activeTab === 'historial' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Historial de Turnos y Rentabilidad
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auditoría detallada con recaudación, comisiones, premios y ganancias por sorteo
              </p>
            </div>

            <div className="flex items-center gap-2">
              <CustomDateRangePicker
                value={historialRange}
                onChange={(r) => setHistorialRange(r)}
              />
              <button
                onClick={loadHistorial}
                disabled={loadingHistorial}
                className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHistorial ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loadingHistorial ? (
            <div className="flex items-center justify-center p-16 text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="text-xs font-semibold">Cargando historial...</span>
            </div>
          ) : historialSorteos.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              No se encontraron sorteos en el rango de fechas seleccionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Turno / Código</th>
                    <th className="py-3 px-3 text-center">Ganador</th>
                    <th className="py-3 px-3 text-right">Venta Total</th>
                    <th className="py-3 px-3 text-right">Premios Pagados</th>
                    <th className="py-3 px-3 text-right">Comisiones (10%)</th>
                    <th className="py-3 px-3 text-right">Ganancia Neta</th>
                    <th className="py-3 px-3 text-center">Boletos / Vendedores</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historialSorteos.map((s) => {
                    const { horaStr, nombre } = getDisplayHoraYNombre(s);
                    return (
                      <tr 
                        key={s.id} 
                        onClick={() => handleOpenDetalleSorteo(s.id)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {s.fecha}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">{horaStr} {nombre}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{s.codigo}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {s.numeroGanador ? (
                            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-black text-xs inline-flex items-center justify-center shadow-sm">
                              {s.numeroGanador}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">--</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ${s.ventaTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          ${s.premioTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                          ${s.comisionesTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                          ${s.utilidadNeta.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {s.totalBoletos} boletos ({s.cantidadVendedores} vend.)
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetalleSorteo(s.id);
                            }}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Detalle Completo del Sorteo (Con Desglose por Vendedor) */}
      {loadingDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Cargando métricas del sorteo...</span>
          </div>
        </div>
      )}

      {selectedSorteoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center font-mono text-base shadow-sm">
                  {selectedSorteoDetalle.numeroGanador || '??'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Detalle del Turno: {selectedSorteoDetalle.horarioNombre || 'Sorteo'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Código: <strong className="font-mono">{selectedSorteoDetalle.codigo}</strong> &bull; Fecha: {selectedSorteoDetalle.fecha}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSorteoDetalle(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen Financiero del Sorteo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Recaudación Total</span>
                <p className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  ${selectedSorteoDetalle.ventaTotal.toFixed(2)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-rose-500">Premios a Pagar</span>
                <p className="text-base font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                  ${selectedSorteoDetalle.premioTotal.toFixed(2)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-500">Comisiones (10%)</span>
                <p className="text-base font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                  ${selectedSorteoDetalle.comisionesTotal.toFixed(2)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Ganancia Neta</span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  ${selectedSorteoDetalle.utilidadNeta.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Desglose por Vendedor en este Sorteo */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Ventas y Comisiones por Vendedor en este Sorteo
              </span>

              {selectedSorteoDetalle.desgloseVendedores.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No se registraron ventas en este turno.</p>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Vendedor</th>
                        <th className="py-2.5 px-3">Sucursal</th>
                        <th className="py-2.5 px-3 text-center">Boletos</th>
                        <th className="py-2.5 px-3 text-right">Vendido</th>
                        <th className="py-2.5 px-3 text-right">Comisión (10%)</th>
                        <th className="py-2.5 px-3 text-right">Premios</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedSorteoDetalle.desgloseVendedores.map((v) => (
                        <tr key={v.vendedorId}>
                          <td className="py-2.5 px-3">
                            <strong className="text-slate-900 dark:text-white block">{v.nombreVendedor}</strong>
                            <span className="text-[10px] text-slate-400">{v.cedula}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{v.zonaNombre}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{v.boletosEmitidos}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ${v.totalVendido.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            +${v.comisionGanada.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                            ${v.premiosAsociados.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top Números Más Jugados en el Sorteo */}
            {selectedSorteoDetalle.topNumeros.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Números con Mayor Apuesta en este Sorteo
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedSorteoDetalle.topNumeros.map((n) => (
                    <div 
                      key={n.numero}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800 text-xs font-mono font-bold"
                    >
                      <span className="w-5 h-5 rounded bg-[#00BCD4] text-black font-black flex items-center justify-center text-[11px]">
                        {n.numero}
                      </span>
                      <span className="text-slate-900 dark:text-white">${n.totalVendido.toFixed(0)}</span>
                      <span className="text-[10px] text-slate-400">({n.cantidadJugadas} jug.)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSorteoDetalle(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear Sorteo Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Crear Sorteo Extraordinario</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="mt-4 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Fecha Oficial
                </label>
                <CustomDatePicker
                  value={selectedFecha}
                  onChange={(f) => setSelectedFecha(f)}
                />
              </div>

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

              <div className="pt-2 flex items-center justify-end gap-2">
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
                  Crear Sorteo
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
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Estado del Sorteo
                </label>
                <CustomSelect
                  options={estadoSelectOptions}
                  value={editEstado}
                  onChange={(val) => setEditEstado(val)}
                  placeholder="Seleccionar Estado"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
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

      {/* Modal: Crear / Editar Plantilla de Turno Recurrente */}
      {isHorarioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingHorarioId ? 'Editar Turno Recurrente' : 'Nuevo Turno Recurrente'}
                </h3>
              </div>
              <button
                onClick={() => setIsHorarioModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHorario} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nombre del Turno Oficial
                </label>
                <input
                  type="text"
                  value={horarioNombre}
                  onChange={(e) => setHorarioNombre(e.target.value)}
                  placeholder="ej. Sorteo Mediodía"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Hora de Cierre
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={horarioHoraCierre}
                    onChange={(e) => setHorarioHoraCierre(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Bloqueo Previo (Min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={horarioMinutosBloqueo}
                    onChange={(e) => setHorarioMinutosBloqueo(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Días que Opera
                </label>
                <input
                  type="text"
                  value={horarioDiasSemana}
                  onChange={(e) => setHorarioDiasSemana(e.target.value)}
                  placeholder="L,M,X,J,V,S,D"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Separados por coma: L, M, X, J, V, S, D</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Activar para generación diaria
                </span>
                <input
                  type="checkbox"
                  checked={horarioActivo}
                  onChange={(e) => setHorarioActivo(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHorarioModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingHorario}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingHorario && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingHorarioId ? 'Guardar Cambios' : 'Crear Turno Recurrente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Estilizado */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalState.onConfirm}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText || 'Eliminar'}
        isLoading={confirmModalState.isLoading}
        variant="danger"
      />
    </div>
  );
};
