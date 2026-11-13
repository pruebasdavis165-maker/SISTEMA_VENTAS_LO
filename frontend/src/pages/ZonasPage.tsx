import React, { useEffect, useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Search, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Users,
  Percent,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Zona } from '../types/zonas';

export const ZonasPage: React.FC = () => {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [filteredZonas, setFilteredZonas] = useState<Zona[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [coeficientePremio, setCoeficientePremio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchZonas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<Zona[]>('/zonas');
      setZonas(res.data);
      setFilteredZonas(res.data);
    } catch (err: any) {
      setError('Error al cargar la lista de zonas comerciales.');
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
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (zona: Zona) => {
    setModalMode('edit');
    setSelectedZonaId(zona.id);
    setNombre(zona.nombre);
    setCoeficientePremio(zona.coeficientePremio.toString());
    setFormError(null);
    setIsModalOpen(true);
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
      setFormError('El coeficiente de premio debe ser un número mayor a 0 (ej. 80.00).');
      return;
    }

    try {
      setIsSaving(true);
      if (modalMode === 'create') {
        await api.post('/zonas', {
          nombre: nombre.trim(),
          coeficientePremio: coef
        });
        setSuccessMessage('Zona comercial creada con éxito.');
      } else if (selectedZonaId) {
        await api.put(`/zonas/${selectedZonaId}`, {
          nombre: nombre.trim(),
          coeficientePremio: coef
        });
        setSuccessMessage('Zona comercial actualizada correctamente.');
      }

      setIsModalOpen(false);
      await fetchZonas();
      setTimeout(() => setSuccessMessage(null), 4000);
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
      setSuccessMessage(`Zona "${zona.nombre}" ${nuevoEstado ? 'activada' : 'desactivada'} correctamente.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('No se pudo cambiar el estado de la zona.');
      setTimeout(() => setError(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            Parámetros Geográficos de Rentabilidad (CU01)
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">Gestión de Zonas y Coeficientes</h2>
          <p className="text-xs text-slate-400 mt-1">
            Define el multiplicador de premios por sucursal. Los vendedores heredan automáticamente este parámetro al emitir boletos.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva Zona
        </button>
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
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar zona por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterEstado(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterEstado === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Inactivas'}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-sm">Cargando zonas comerciales...</span>
          </div>
        ) : filteredZonas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <MapPin className="w-10 h-10 text-slate-600 mb-3" />
            <h4 className="text-sm font-bold text-white">No se encontraron zonas comerciales</h4>
            <p className="text-xs text-slate-400 mt-1">Crea una nueva zona para comenzar a configurar vendedores y sorteos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Zona / Sucursal</th>
                  <th className="py-3.5 px-4">Coeficiente de Premio</th>
                  <th className="py-3.5 px-4">Vendedores</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredZonas.map((zona) => (
                  <tr key={zona.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                          {zona.nombre.charAt(0)}
                        </div>
                        <span>{zona.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-xs">
                        <Percent className="w-3.5 h-3.5" />
                        x{Number(zona.coeficientePremio).toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{zona.cantidadVendedores} asignados</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleEstado(zona)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                          zona.estado
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {zona.estado ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Activa
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactiva
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(zona)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Editar Zona"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {modalMode === 'create' ? 'Nueva Zona Comercial' : 'Editar Zona Comercial'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre de la Zona
                </label>
                <input
                  type="text"
                  placeholder="ej. Zona El Recreo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Coeficiente de Premio (Multiplicador)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="ej. 80.00"
                    value={coeficientePremio}
                    onChange={(e) => setCoeficientePremio(e.target.value)}
                    className="w-full pl-3.5 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">x</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Fórmula: Monto apostado × Coeficiente = Premio a pagar (Ej. $20 × 80 = $1,600).
                </p>
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
                  {modalMode === 'create' ? 'Crear Zona' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
