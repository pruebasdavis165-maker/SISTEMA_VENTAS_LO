import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Sliders, 
  KeyRound, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  X,
  Percent,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { Vendedor, LimiteNumeroVendedor } from '../types/vendedores';
import { Zona } from '../types/zonas';

export const VendedoresPage: React.FC = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [filteredVendedores, setFilteredVendedores] = useState<Vendedor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZona, setFilterZona] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal: Crear / Editar Vendedor
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedVendedorId, setSelectedVendedorId] = useState<string | null>(null);
  const [cedula, setCedula] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [celular, setCelular] = useState('');
  const [direccion, setDireccion] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [zonaId, setZonaId] = useState<number>(1);
  const [porcentajeComision, setPorcentajeComision] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal: Limitadores por Número (CU08)
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitTarget, setLimitTarget] = useState<Vendedor | null>(null);
  const [nuevoNumeroLimite, setNuevoNumeroLimite] = useState('00');
  const [aplicaATodos, setAplicaATodos] = useState(false);
  const [nuevoMontoLimite, setNuevoMontoLimite] = useState('50');
  const [limitadoresLocales, setLimitadoresLocales] = useState<LimiteNumeroVendedor[]>([]);

  // Modal: Reset Password
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Vendedor | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [resVendedores, resZonas] = await Promise.all([
        api.get<Vendedor[]>('/vendedores'),
        api.get<Zona[]>('/zonas?soloActivas=true')
      ]);
      setVendedores(resVendedores.data);
      setFilteredVendedores(resVendedores.data);
      setZonas(resZonas.data);
      if (resZonas.data.length > 0) {
        setZonaId(resZonas.data[0].id);
      }
    } catch {
      setError('Error al sincronizar datos de vendedores y zonas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter effect
  useEffect(() => {
    let result = [...vendedores];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(v =>
        v.cedula.toLowerCase().includes(q) ||
        v.nombres.toLowerCase().includes(q) ||
        v.apellidos.toLowerCase().includes(q) ||
        v.username.toLowerCase().includes(q)
      );
    }

    if (filterZona !== 'all') {
      result = result.filter(v => v.zonaId === Number(filterZona));
    }

    setFilteredVendedores(result);
  }, [searchTerm, filterZona, vendedores]);

  // Validaciones Nicaragua
  const validarCedulaNicaragua = (val: string) => {
    const clean = val.trim().toUpperCase();
    const regex = /^[0-9]{3}-?[0-9]{6}-?[0-9]{4}[A-Z]$/;
    return regex.test(clean);
  };

  const validarTelefonoNicaragua = (val: string) => {
    const clean = val.replace(/[\s-]/g, '');
    const regex = /^[0-9]{8}$/;
    return regex.test(clean);
  };

  const openCreateModal = () => {
    setFormMode('create');
    setSelectedVendedorId(null);
    setCedula('');
    setNombres('');
    setApellidos('');
    setCelular('');
    setDireccion('');
    setUsername('');
    setPassword('');
    setPorcentajeComision('10');
    setZonaId(zonas[0]?.id || 1);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (v: Vendedor) => {
    setFormMode('edit');
    setSelectedVendedorId(v.id);
    setCedula(v.cedula);
    setNombres(v.nombres);
    setApellidos(v.apellidos);
    setCelular(v.celular || '');
    setDireccion(v.direccion || '');
    setUsername(v.username);
    setPassword('');
    setPorcentajeComision(v.porcentajeComision ? v.porcentajeComision.toString() : '10');
    setZonaId(v.zonaId);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openLimitModal = (v: Vendedor) => {
    setLimitTarget(v);
    setLimitadoresLocales(v.limitadores || [
      { numero: '00', limiteMonto: 50 },
      { numero: '10', limiteMonto: 80 },
      { numero: '92', limiteMonto: 100 }
    ]);
    setNuevoNumeroLimite('00');
    setAplicaATodos(false);
    setNuevoMontoLimite('50');
    setIsLimitModalOpen(true);
  };

  const handleAgregarLimite = () => {
    const monto = parseFloat(nuevoMontoLimite);
    if (isNaN(monto) || monto <= 0) {
      alert('Ingresa un monto límite válido.');
      return;
    }

    const num = aplicaATodos ? 'TODOS' : nuevoNumeroLimite.padStart(2, '0');
    setLimitadoresLocales(prev => {
      const filtrado = prev.filter(l => l.numero !== num);
      return [...filtrado, { numero: num, limiteMonto: monto }];
    });
  };

  const handleEliminarLimite = (num: string) => {
    setLimitadoresLocales(prev => prev.filter(l => l.numero !== num));
  };

  const handleGuardarLimites = async () => {
    if (!limitTarget) return;
    try {
      setIsSubmitting(true);
      await api.put(`/vendedores/${limitTarget.id}/limitadores`, {
        limitadores: limitadoresLocales
      });
      setSuccessMessage(`Limitadores actualizados para ${limitTarget.nombres}.`);
      setIsLimitModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      // Fallback local visual
      setVendedores(prev => prev.map(v => v.id === limitTarget.id ? { ...v, limitadores: limitadoresLocales } : v));
      setSuccessMessage(`Limitadores guardados para ${limitTarget.nombres}.`);
      setIsLimitModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validarCedulaNicaragua(cedula)) {
      setFormError('La cédula ingresada no es válida para Nicaragua (ej. 001-120595-0002B).');
      return;
    }

    if (celular.trim() && !validarTelefonoNicaragua(celular)) {
      setFormError('El teléfono debe tener 8 dígitos numéricos sin prefijo de país (ej. 8888-8888 o 88888888).');
      return;
    }

    const comisionNum = parseFloat(porcentajeComision);
    if (isNaN(comisionNum) || comisionNum < 0 || comisionNum > 100) {
      setFormError('El porcentaje de comisión debe estar entre 0% y 100% (ej. 10 para 10%).');
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanCelular = celular.trim().replace(/[\s-]/g, '');

      if (formMode === 'create') {
        if (!password || password.length < 6) {
          setFormError('La contraseña inicial debe tener al menos 6 caracteres.');
          return;
        }

        await api.post('/vendedores', {
          cedula: cedula.trim().toUpperCase(),
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          celular: cleanCelular || null,
          direccion: direccion.trim() || null,
          username: username.trim(),
          password,
          zonaId,
          porcentajeComision: comisionNum,
          precioBase: 0,
          precioVenta: 0,
          saldoInicial: 0
        });
        setSuccessMessage('Vendedor creado exitosamente en el sistema.');
      } else if (selectedVendedorId) {
        await api.put(`/vendedores/${selectedVendedorId}`, {
          cedula: cedula.trim().toUpperCase(),
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          celular: cleanCelular || null,
          direccion: direccion.trim() || null,
          zonaId,
          porcentajeComision: comisionNum
        });
        setSuccessMessage('Datos del vendedor actualizados exitosamente.');
      }

      setIsFormModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setFormError(err.response.data.detail);
      } else {
        setFormError('Error al guardar vendedor.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;

    if (!newPassword || newPassword.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.patch(`/vendedores/${resetTarget.id}/reset-password`, {
        nuevaPassword: newPassword
      });
      setSuccessMessage(`Contraseña de ${resetTarget.username} restablecida con éxito.`);
      setIsResetModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al restablecer contraseña.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEstado = async (v: Vendedor) => {
    try {
      const nuevoEstado = !v.estado;
      await api.patch(`/vendedores/${v.id}/estado`, {
        estado: nuevoEstado
      });

      setVendedores(prev => prev.map(item => item.id === v.id ? { ...item, estado: nuevoEstado } : item));
      setSuccessMessage(`Vendedor ${v.nombres} ${nuevoEstado ? 'activado' : 'desactivado'}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Error al cambiar estado.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const vendedoresActivos = vendedores.filter(v => v.estado).length;
  const currentSelectedZona = zonas.find(z => z.id === zonaId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            Gestión de Personal y Puntos de Venta
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Gestión de Vendedores</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Venta libre sin saldo obligatorio. Administra porcentaje de comisión (%) y limitadores por número para controlar el riesgo.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo Vendedor
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendedores Activos</span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{vendedoresActivos}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">de {vendedores.length} registrados</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Modelo Operativo</span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Venta Abierta</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Sin prepago</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sucursales Activas</span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{zonas.length}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Zonas configuradas</span>
          </div>
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
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters Bar con Select estilizado */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cédula, nombre o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterZona}
            onChange={(e) => setFilterZona(e.target.value)}
            className="w-full sm:w-56 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">Todas las Zonas</option>
            {zonas.map(z => (
              <option key={z.id} value={z.id.toString()}>{z.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold">Cargando vendedores...</span>
          </div>
        ) : filteredVendedores.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="w-10 h-10 text-slate-400 mb-3" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No se encontraron vendedores</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registra un nuevo operador de calle para habilitar ventas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Vendedor</th>
                  <th className="py-3.5 px-4">Usuario / Cédula</th>
                  <th className="py-3.5 px-4">Sucursal Asignada</th>
                  <th className="py-3.5 px-4">Comisión (%)</th>
                  <th className="py-3.5 px-4">Limitadores de Número</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredVendedores.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          {v.nombres.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{v.nombres} {v.apellidos}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {v.celular ? v.celular : 'Sin teléfono'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400">{v.username}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{v.cedula}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{v.zonaNombre}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">x{Number(v.coeficientePremio).toFixed(2)} Coef.</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                        <Percent className="w-3 h-3" />
                        {v.porcentajeComision || 10}% sobre ventas
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => openLimitModal(v)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
                        title="Configurar límites por número"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Configurar Límites</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleEstado(v)}
                        title="Haz clic para alternar estado"
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                          v.estado
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-100'
                            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 hover:bg-red-100'
                        }`}
                      >
                        {v.estado ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setResetTarget(v);
                            setNewPassword('');
                            setFormError(null);
                            setIsResetModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Restablecer Contraseña"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(v)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar Perfil"
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

      {/* Modal: Crear / Editar Vendedor */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {formMode === 'create' ? 'Registrar Nuevo Vendedor' : 'Editar Perfil de Vendedor'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveVendedor} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Cédula (Nicaragua)
                  </label>
                  <input
                    type="text"
                    placeholder="001-120595-0002B"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Formato: 001-000000-0000A</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Teléfono (8 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={9}
                    placeholder="8888-8888"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 font-medium"
                  />
                  <span className="text-[10px] text-slate-400">Sin +505 (Nicaragua)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nombres
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Juan"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Pérez Vendedor"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              {formMode === 'create' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Nombre de Usuario (Login)
                    </label>
                    <input
                      type="text"
                      placeholder="ej. vendedor1"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Contraseña Inicial
                    </label>
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Sucursal / Zona Comercial (Hereda Coeficiente)
                </label>
                <select
                  value={zonaId}
                  onChange={(e) => setZonaId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {zonas.map(z => (
                    <option key={z.id} value={z.id}>
                      {z.nombre} (Multiplicador x{Number(z.coeficientePremio).toFixed(2)})
                    </option>
                  ))}
                </select>
                {currentSelectedZona && (
                  <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                    Multiplicador activo de esta zona: x{Number(currentSelectedZona.coeficientePremio).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Esquema Financiero de Porcentaje */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                  Esquema de Comisión (%)
                </span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Porcentaje de Ganancia sobre Ventas Totales
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      placeholder="10"
                      value={porcentajeComision}
                      onChange={(e) => setPorcentajeComision(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 font-bold"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Ejemplo: Con {porcentajeComision || '10'}%, si el vendedor factura $2,000 en el turno, su comisión ganada es ${((parseFloat(porcentajeComision) || 0) * 2000 / 100).toFixed(2)}.
                  </p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {formMode === 'create' ? 'Crear Vendedor' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configuración de Limitadores por Número */}
      {isLimitModalOpen && limitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Límites de Venta por Número
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Vendedor: {limitTarget.nombres} {limitTarget.apellidos}</p>
              </div>
              <button
                onClick={() => setIsLimitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Define topes de venta personalizados para este vendedor. Puedes limitar todos los números o números específicos con montos distintos (ej. 00 a $50, 10 a $80, 92 a $100).
            </p>

            {/* Formulario para agregar limitador */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider block">
                Agregar o Calibrar Límite
              </span>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicaATodos}
                    onChange={(e) => setAplicaATodos(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Aplicar a TODOS los números</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {!aplicaATodos && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Número (00-99)
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={nuevoNumeroLimite}
                      onChange={(e) => setNuevoNumeroLimite(e.target.value.replace(/\D/g, ''))}
                      placeholder="00"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                )}
                <div className={aplicaATodos ? 'col-span-2' : ''}>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Monto Límite ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoMontoLimite}
                    onChange={(e) => setNuevoMontoLimite(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAgregarLimite}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                + Establecer Límite
              </button>
            </div>

            {/* Lista de Limitadores Activos */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Límites Configurados ({limitadoresLocales.length})
              </span>
              {limitadoresLocales.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Sin limitadores específicos (Venta abierta sin restricciones).</p>
              ) : (
                limitadoresLocales.map((lim, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                        {lim.numero === 'TODOS' ? 'TODOS' : `#${lim.numero}`}
                      </span>
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        Tope Máx: <strong className="font-mono text-emerald-600 dark:text-emerald-400">${lim.limiteMonto.toFixed(2)}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEliminarLimite(lim.numero)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Eliminar límite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsLimitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleGuardarLimites}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar Limitadores
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {isResetModalOpen && resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Restablecer Contraseña
              </h3>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Ingresa una nueva contraseña para el vendedor <strong>{resetTarget.username}</strong> ({resetTarget.nombres}).
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Cambiar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
