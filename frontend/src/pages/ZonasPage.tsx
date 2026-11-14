import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Users, 
  Percent, 
  X,
  ShieldAlert,
  Trash2,
  Layers,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';
import { Zona } from '../types/zonas';
import { useToastStore } from '../store/useToastStore';

interface BloqueoZona {
  numero: string;
  motivo?: string;
  createdAt: string;
}

export const ZonasPage: React.FC = () => {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [filteredZonas, setFilteredZonas] = useState<Zona[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToastStore();

  // Modal State: Crear / Editar Zona
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [coeficientePremio, setCoeficientePremio] = useState('');
  const [estado, setEstado] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal State: Bloqueos y Topes de Zona
  const [isBloqueosModalOpen, setIsBloqueosModalOpen] = useState(false);
  const [zonaBloqueoTarget, setZonaBloqueoTarget] = useState<Zona | null>(null);
  const [bloqueosZona, setBloqueosZona] = useState<BloqueoZona[]>([]);
  const [loadingBloqueos, setLoadingBloqueos] = useState(false);
  const [tipoBloqueo, setTipoBloqueo] = useState<'rango' | 'individual'>('rango');
  const [rangoDesde, setRangoDesde] = useState('00');
  const [rangoHasta, setRangoHasta] = useState('29');
  const [numeroIndividual, setNumeroIndividual] = useState('00');
  const [motivoBloqueo, setMotivoBloqueo] = useState('Tope de riesgo preventivo');

  const fetchZonas = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Zona[]>('/zonas');
      setZonas(res.data);
      setFilteredZonas(res.data);
    } catch {
      toast.error('Error al cargar la lista de zonas comerciales.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZonas();
  }, []);

  // Filter effect
  useEffect(() => {
    let result = [...zonas];

    if (searchTerm.trim()) {
      result = result.filter(z => z.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (filterEstado === 'active') {
      result = result.filter(z => z.estado);
    } else if (filterEstado === 'inactive') {
      result = result.filter(z => !z.estado);
    }

    setFilteredZonas(result);
  }, [searchTerm, filterEstado, zonas]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedZonaId(null);
    setNombre('');
    setCoeficientePremio('80');
    setEstado(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (zona: Zona) => {
    setModalMode('edit');
    setSelectedZonaId(zona.id);
    setNombre(zona.nombre);
    setCoeficientePremio(zona.coeficientePremio.toString());
    setEstado(zona.estado);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openBloqueosModal = async (zona: Zona) => {
    setZonaBloqueoTarget(zona);
    setIsBloqueosModalOpen(true);
    setLoadingBloqueos(true);
    try {
      const res = await api.get<BloqueoZona[]>(`/zonas/${zona.id}/bloqueos`);
      setBloqueosZona(res.data);
    } catch {
      setBloqueosZona([]);
    } finally {
      setLoadingBloqueos(false);
    }
  };

  const handleBloquearRango = async () => {
    if (!zonaBloqueoTarget) return;

    const desde = parseInt(rangoDesde, 10);
    const hasta = parseInt(rangoHasta, 10);

    if (isNaN(desde) || desde < 0 || desde > 99 || isNaN(hasta) || hasta < 0 || hasta > 99) {
      toast.error('El rango debe estar entre 00 y 99.');
      return;
    }

    if (desde > hasta) {
      toast.error('El número inicial debe ser menor o igual al final.');
      return;
    }

    const numeros: string[] = [];
    for (let i = desde; i <= hasta; i++) {
      numeros.push(i.toString().padStart(2, '0'));
    }

    try {
      await api.post(`/zonas/${zonaBloqueoTarget.id}/bloqueos`, {
        numeros,
        motivo: motivoBloqueo
      });

      toast.success(`Se bloquearon ${numeros.length} números en la ${zonaBloqueoTarget.nombre}.`);
      const res = await api.get<BloqueoZona[]>(`/zonas/${zonaBloqueoTarget.id}/bloqueos`);
      setBloqueosZona(res.data);
    } catch {
      toast.error('Error al aplicar bloqueos en la zona.');
    }
  };

  const handleBloquearIndividual = async () => {
    if (!zonaBloqueoTarget) return;

    const num = numeroIndividual.padStart(2, '0');
    try {
      await api.post(`/zonas/${zonaBloqueoTarget.id}/bloqueos`, {
        numeros: [num],
        motivo: motivoBloqueo
      });

      toast.success(`Número #${num} bloqueado en la ${zonaBloqueoTarget.nombre}.`);
      const res = await api.get<BloqueoZona[]>(`/zonas/${zonaBloqueoTarget.id}/bloqueos`);
      setBloqueosZona(res.data);
    } catch {
      toast.error('Error al bloquear número en la zona.');
    }
  };

  const handleBloquearTodos = async () => {
    if (!zonaBloqueoTarget) return;

    const numeros: string[] = [];
    for (let i = 0; i <= 99; i++) {
      numeros.push(i.toString().padStart(2, '0'));
    }

    try {
      await api.post(`/zonas/${zonaBloqueoTarget.id}/bloqueos`, {
        numeros,
        motivo: motivoBloqueo || 'Corte general de zona'
      });

      toast.success(`Todos los 100 números (00-99) bloqueados en ${zonaBloqueoTarget.nombre}.`);
      const res = await api.get<BloqueoZona[]>(`/zonas/${zonaBloqueoTarget.id}/bloqueos`);
      setBloqueosZona(res.data);
    } catch {
      toast.error('Error al bloquear números.');
    }
  };

  const handleDesbloquearNumeroZona = async (numero: string) => {
    if (!zonaBloqueoTarget) return;

    try {
      await api.delete(`/zonas/${zonaBloqueoTarget.id}/bloqueos/${numero}`);
      toast.success(`Número #${numero} desbloqueado en la ${zonaBloqueoTarget.nombre}.`);
      setBloqueosZona(prev => prev.filter(b => b.numero !== numero));
    } catch {
      toast.error('Error al desbloquear número.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const coef = parseFloat(coeficientePremio);
    if (!nombre.trim()) {
      setFormError('El nombre de la zona es obligatorio.');
      return;
    }

    if (isNaN(coef) || coef <= 0) {
      setFormError('El coeficiente de premio debe ser un número positivo (ej. 80 para pagar $80 por cada $1 apostado).');
      return;
    }

    if (coef > 99) {
      setFormError('El límite máximo permitido para el coeficiente de premio es 99.');
      return;
    }

    try {
      setIsSaving(true);
      if (modalMode === 'create') {
        await api.post('/zonas', {
          nombre: nombre.trim(),
          coeficientePremio: coef
        });
        toast.success('Zona comercial creada con éxito.');
      } else if (selectedZonaId) {
        await api.put(`/zonas/${selectedZonaId}`, {
          nombre: nombre.trim(),
          coeficientePremio: coef,
          estado: estado
        });
        toast.success('Zona comercial actualizada correctamente.');
      } else {
        toast.success('Zona comercial registrada correctamente.');
      }

      setIsModalOpen(false);
      await fetchZonas();
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setFormError(err.response.data.detail);
      } else {
        setFormError('No se pudo guardar la zona comercial.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEstado = async (zona: Zona) => {
    try {
      const nuevoEstado = !zona.estado;
      await api.patch(`/zonas/${zona.id}/estado`, {
        estado: nuevoEstado
      });

      setZonas(prev => prev.map(z => z.id === zona.id ? { ...z, estado: nuevoEstado } : z));
      toast.success(`Zona "${zona.nombre}" ${nuevoEstado ? 'activada' : 'desactivada'} correctamente.`);
    } catch {
      toast.error('No se pudo cambiar el estado de la zona.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Gestión de Zonas y Coeficientes</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configuración de multiplicador de premios por sucursal (máx 99) y topes/bloqueos preventivos por número
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva Zona
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar zona por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterEstado(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterEstado === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Inactivas'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Zonas */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold">Cargando zonas comerciales...</span>
          </div>
        ) : filteredZonas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No se encontraron zonas comerciales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Zona / Sucursal</th>
                  <th className="py-3.5 px-4">Coeficiente de Premio</th>
                  <th className="py-3.5 px-4">Vendedores</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredZonas.map((zona) => (
                  <tr key={zona.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          {zona.nombre.charAt(0)}
                        </div>
                        <span>{zona.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                        <Percent className="w-3.5 h-3.5" />
                        x{Number(zona.coeficientePremio).toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{zona.cantidadVendedores} asignados</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleEstado(zona)}
                        title="Haz clic para alternar estado"
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                          zona.estado
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-100'
                            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 hover:bg-red-100'
                        }`}
                      >
                        {zona.estado ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Activa
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Inactiva
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón de Bloqueos y Topes de Zona */}
                        <button
                          onClick={() => openBloqueosModal(zona)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Gestionar Bloqueos y Topes por Número en esta Zona"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                        {/* Botón de Editar Zona */}
                        <button
                          onClick={() => openEditModal(zona)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar Zona"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Zona */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {modalMode === 'create' ? 'Nueva Zona Comercial' : 'Editar Zona Comercial'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nombre de la Zona
                </label>
                <input
                  type="text"
                  placeholder="ej. Zona Central"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Coeficiente de Premio (Multiplicador, máx 99)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="99"
                  placeholder="80"
                  value={coeficientePremio}
                  onChange={(e) => setCoeficientePremio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Fórmula: Monto apostado &times; Coeficiente = Premio a pagar (Ej. $20 &times; 80 = $1,600).
                </p>
              </div>

              {modalMode === 'edit' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Estado de la Zona
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEstado(true)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        estado
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Activa
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstado(false)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        !estado
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Inactiva
                    </button>
                  </div>
                </div>
              )}

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
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bloqueos y Topes de Zona */}
      {isBloqueosModalOpen && zonaBloqueoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  Topes y Bloqueos: {zonaBloqueoTarget.nombre}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control de corte preventivo de números exclusivo para esta sucursal
                </p>
              </div>
              <button
                onClick={() => setIsBloqueosModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Modo */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTipoBloqueo('rango')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tipoBloqueo === 'rango'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Por Rango de Números
              </button>
              <button
                type="button"
                onClick={() => setTipoBloqueo('individual')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tipoBloqueo === 'individual'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Número Específico
              </button>
            </div>

            {/* Formulario Modo Rango */}
            {tipoBloqueo === 'rango' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Bloquear Rango de Números en esta Zona
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Desde (00-99)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={rangoDesde}
                      onChange={(e) => setRangoDesde(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Hasta (00-99)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={rangoHasta}
                      onChange={(e) => setRangoHasta(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Motivo del Bloqueo
                  </label>
                  <input
                    type="text"
                    value={motivoBloqueo}
                    onChange={(e) => setMotivoBloqueo(e.target.value)}
                    placeholder="ej. Tope alcanzado en sucursal"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleBloquearRango}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    + Bloquear Rango ({rangoDesde.padStart(2, '0')} al {rangoHasta.padStart(2, '0')})
                  </button>
                  <button
                    type="button"
                    onClick={handleBloquearTodos}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Bloquear Todos
                  </button>
                </div>
              </div>
            )}

            {/* Formulario Modo Individual */}
            {tipoBloqueo === 'individual' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Bloquear Número Específico en esta Zona
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Número (00-99)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={numeroIndividual}
                      onChange={(e) => setNumeroIndividual(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Motivo
                    </label>
                    <input
                      type="text"
                      value={motivoBloqueo}
                      onChange={(e) => setMotivoBloqueo(e.target.value)}
                      placeholder="ej. Saturación de jugadas"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBloquearIndividual}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  + Bloquear Número #{numeroIndividual.padStart(2, '0')}
                </button>
              </div>
            )}

            {/* Lista de Bloqueos Activos en esta Zona */}
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                Números Bloqueados en esta Zona ({bloqueosZona.length})
              </span>

              {loadingBloqueos ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                  Cargando bloqueos...
                </div>
              ) : bloqueosZona.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  No hay números bloqueados en esta zona (Venta libre).
                </p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {bloqueosZona.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          #{b.numero}
                        </span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-xs">
                          {b.motivo || 'Bloqueado por directiva'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDesbloquearNumeroZona(b.numero)}
                        className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                        title="Desbloquear número en esta zona"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-end border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBloqueosModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
