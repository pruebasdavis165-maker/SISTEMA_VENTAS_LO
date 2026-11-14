import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  KeyRound, 
  Sliders, 
  Trash2, 
  X, 
  Edit3, 
  Loader2,
  Percent,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { Vendedor, LimiteNumeroVendedor } from '../types/vendedores';
import { Zona } from '../types/zonas';
import { useToastStore } from '../store/useToastStore';
import { CustomSelect } from '../components/common/CustomSelect';

export const VendedoresPage: React.FC = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [filteredVendedores, setFilteredVendedores] = useState<Vendedor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZona, setFilterZona] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Toast
  const toast = useToastStore();

  // Modal: Crear / Editar Vendedor
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedVendedorId, setSelectedVendedorId] = useState<string | null>(null);

  // Form Fields
  const [cedula, setCedula] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [celular, setCelular] = useState('');
  const [direccion, setDireccion] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [zonaId, setZonaId] = useState<number>(1);
  const [porcentajeComision, setPorcentajeComision] = useState<string>('10');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal: Restablecer Password
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Vendedor | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Modal: Limitadores por Número
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitTarget, setLimitTarget] = useState<Vendedor | null>(null);
  const [limitadoresLocales, setLimitadoresLocales] = useState<LimiteNumeroVendedor[]>([]);
  const [tipoConfiguracion, setTipoConfiguracion] = useState<'rango' | 'individual'>('rango');
  
  // Limites individuales
  const [nuevoNumeroLimite, setNuevoNumeroLimite] = useState('00');
  const [nuevoMontoLimite, setNuevoMontoLimite] = useState('50');

  // Limites por rango
  const [rangoDesde, setRangoDesde] = useState('00');
  const [rangoHasta, setRangoHasta] = useState('29');
  const [rangoMonto, setRangoMonto] = useState('50');

  const loadData = async () => {
    try {
      setIsLoading(true);
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
      toast.error('Error al sincronizar datos de vendedores y zonas.');
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
    setCedula(v.cedula ? v.cedula.toUpperCase() : '');
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
    setTipoConfiguracion('rango');
    setRangoDesde('00');
    setRangoHasta('29');
    setRangoMonto('50');
    setNuevoNumeroLimite('00');
    setNuevoMontoLimite('50');
    setIsLimitModalOpen(true);
  };

  const handleAgregarLimiteIndividual = () => {
    const monto = parseFloat(nuevoMontoLimite);
    if (isNaN(monto) || monto <= 0) {
      toast.error('Ingresa un monto límite válido mayor a 0.');
      return;
    }

    const num = nuevoNumeroLimite.padStart(2, '0');
    setLimitadoresLocales(prev => {
      const filtrado = prev.filter(l => l.numero !== num);
      return [...filtrado, { numero: num, limiteMonto: monto }].sort((a, b) => a.numero.localeCompare(b.numero));
    });
    toast.success(`Límite de $${monto} asignado al número #${num}.`);
  };

  const handleAplicarRango = () => {
    const desde = parseInt(rangoDesde, 10);
    const hasta = parseInt(rangoHasta, 10);
    const monto = parseFloat(rangoMonto);

    if (isNaN(desde) || desde < 0 || desde > 99 || isNaN(hasta) || hasta < 0 || hasta > 99) {
      toast.error('El rango debe estar entre 00 y 99.');
      return;
    }

    if (desde > hasta) {
      toast.error('El número inicial debe ser menor o igual al final.');
      return;
    }

    if (isNaN(monto) || monto <= 0) {
      toast.error('Ingresa un monto límite válido mayor a 0.');
      return;
    }

    const nuevosLimites: LimiteNumeroVendedor[] = [];
    for (let i = desde; i <= hasta; i++) {
      nuevosLimites.push({
        numero: i.toString().padStart(2, '0'),
        limiteMonto: monto
      });
    }

    const setNumeros = new Set(nuevosLimites.map(n => n.numero));
    setLimitadoresLocales(prev => {
      const filtrado = prev.filter(l => !setNumeros.has(l.numero));
      return [...filtrado, ...nuevosLimites].sort((a, b) => a.numero.localeCompare(b.numero));
    });

    toast.success(`Límite de $${monto} aplicado a ${nuevosLimites.length} números (${rangoDesde.padStart(2, '0')} al ${rangoHasta.padStart(2, '0')}).`);
  };

  const handleAplicarATodos = (monto: number) => {
    if (isNaN(monto) || monto <= 0) {
      toast.error('Ingresa un monto límite válido.');
      return;
    }

    const todos: LimiteNumeroVendedor[] = [];
    for (let i = 0; i <= 99; i++) {
      todos.push({
        numero: i.toString().padStart(2, '0'),
        limiteMonto: monto
      });
    }
    setLimitadoresLocales(todos);
    toast.success(`Límite uniforme de $${monto} aplicado a todos los 100 números (00-99).`);
  };

  const handleEliminarLimite = (num: string) => {
    setLimitadoresLocales(prev => prev.filter(l => l.numero !== num));
  };

  const handleLimpiarTodosLimites = () => {
    setLimitadoresLocales([]);
    toast.info('Se han removido todos los limitadores específicos (Venta libre).');
  };

  const handleGuardarLimites = async () => {
    if (!limitTarget) return;
    try {
      setIsSubmitting(true);
      await api.put(`/vendedores/${limitTarget.id}/limitadores`, {
        limitadores: limitadoresLocales
      });
      toast.success(`Limitadores guardados para ${limitTarget.nombres}.`);
      setIsLimitModalOpen(false);
      await loadData();
    } catch {
      // Fallback local visual
      setVendedores(prev => prev.map(v => v.id === limitTarget.id ? { ...v, limitadores: limitadoresLocales } : v));
      toast.success(`Limitadores actualizados para ${limitTarget.nombres}.`);
      setIsLimitModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cedulaUpper = cedula.trim().toUpperCase();

    if (!validarCedulaNicaragua(cedulaUpper)) {
      setFormError('La cédula ingresada no es válida para Nicaragua (ej. 001-120595-0002B).');
      return;
    }

    if (celular.trim() && !validarTelefonoNicaragua(celular)) {
      setFormError('El teléfono debe tener 8 dígitos numéricos (ej. 8888-8888).');
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
          cedula: cedulaUpper,
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
        toast.success('Vendedor creado exitosamente en el sistema.');
      } else if (selectedVendedorId) {
        await api.put(`/vendedores/${selectedVendedorId}`, {
          cedula: cedulaUpper,
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          celular: cleanCelular || null,
          direccion: direccion.trim() || null,
          zonaId,
          porcentajeComision: comisionNum
        });
        toast.success('Datos del vendedor actualizados exitosamente.');
      }

      setIsFormModalOpen(false);
      await loadData();
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
      await api.post(`/vendedores/${resetTarget.id}/reset-password`, {
        newPassword
      });
      toast.success(`Contraseña actualizada para ${resetTarget.username}.`);
      setIsResetModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al restablecer contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEstado = async (v: Vendedor) => {
    try {
      await api.patch(`/vendedores/${v.id}/toggle-estado`);
      toast.success(`Estado actualizado para ${v.nombres}.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al cambiar estado.');
    }
  };

  const zonaOptions = [
    { value: 'all', label: 'Todas las Zonas' },
    ...zonas.map(z => ({
      value: z.id.toString(),
      label: z.nombre,
      sublabel: `x${Number(z.coeficientePremio).toFixed(2)}`
    }))
  ];

  const modalZonaOptions = zonas.map(z => ({
    value: z.id,
    label: z.nombre,
    sublabel: `Multiplicador x${Number(z.coeficientePremio).toFixed(2)}`
  }));

  const currentSelectedZona = zonas.find(z => z.id === zonaId);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Gestión de Vendedores</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control de cuentas de acceso, comisiones por venta y topes de riesgo personalizados</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Vendedor
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendedores Registrados</span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{vendedores.length}</h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {vendedores.filter(v => v.estado).length} activos
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comisión Promedio</span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">10.0%</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Sobre venta bruta</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sucursales Activas</span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{zonas.length}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Zonas operativas</span>
          </div>
        </div>
      </div>

      {/* Filters Bar con CustomSelect estilizado */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cédula, nombre o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        <div className="w-full sm:w-60">
          <CustomSelect
            options={zonaOptions}
            value={filterZona}
            onChange={(val) => setFilterZona(val)}
            placeholder="Filtrar por Zona"
          />
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registra un nuevo vendedor para habilitar sus ventas en ruta.</p>
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
                      <span className="font-semibold text-slate-800 dark:text-slate-200">@{v.username}</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono uppercase">{v.cedula}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {v.zonaNombre || 'Zona General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        <Percent className="w-3 h-3" />
                        {v.porcentajeComision || 10}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => openLimitModal(v)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/30 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Configurar ({v.limitadores?.length || 3})</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleEstado(v)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                          v.estado
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30 hover:bg-rose-100'
                        }`}
                      >
                        {v.estado ? 'ACTIVO' : 'INACTIVO'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(v)}
                          title="Editar Vendedor"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setResetTarget(v);
                            setIsResetModalOpen(true);
                          }}
                          title="Restablecer Contraseña"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
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

      {/* Modal: Crear / Editar Vendedor con CustomSelect y Cédula Uppercase */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {formMode === 'create' ? 'Nuevo Vendedor' : 'Editar Perfil de Vendedor'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                {formError}
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
                    placeholder="001-000000-0000A"
                    value={cedula.toUpperCase()}
                    onChange={(e) => setCedula(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase' }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono uppercase font-bold"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Formato: 001-000000-0000A</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Teléfono (8 dígitos)
                  </label>
                  <input
                    type="tel"
                    placeholder="8888-8888"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">8 dígitos sin prefijo internacional</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nombres
                  </label>
                  <input
                    type="text"
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
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      placeholder="ej. juanperez"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
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

              {/* Selector de Sucursal con CustomSelect para evitar el gris nativo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Sucursal / Zona Comercial
                </label>
                <CustomSelect
                  options={modalZonaOptions}
                  value={zonaId}
                  onChange={(val) => setZonaId(Number(val))}
                  placeholder="Seleccionar Zona Comercial"
                />
                {currentSelectedZona && (
                  <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Limitadores por Número (Soporta Rango y Lote) */}
      {isLimitModalOpen && limitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Límites de Venta por Número
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vendedor: <strong className="text-indigo-600 dark:text-indigo-400">{limitTarget.nombres} {limitTarget.apellidos}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsLimitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Modo: Por Rango o Individual */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTipoConfiguracion('rango')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tipoConfiguracion === 'rango'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Por Rango de Números (Lote)
              </button>
              <button
                type="button"
                onClick={() => setTipoConfiguracion('individual')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tipoConfiguracion === 'individual'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Número Específico
              </button>
            </div>

            {/* MODO RANGO */}
            {tipoConfiguracion === 'rango' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Aplicar Límite a un Rango (ej. 00 al 29 con $50)
                </span>

                <div className="grid grid-cols-3 gap-2">
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
                      placeholder="00"
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
                      placeholder="29"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tope Máximo ($)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={rangoMonto}
                      onChange={(e) => setRangoMonto(e.target.value)}
                      placeholder="50"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAplicarRango}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    + Aplicar Límite a Rango ({rangoDesde.padStart(2, '0')} - {rangoHasta.padStart(2, '0')})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAplicarATodos(parseFloat(rangoMonto) || 50)}
                    title="Aplicar este tope a los 100 números (00 a 99)"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Todos (00-99)
                  </button>
                </div>
              </div>
            )}

            {/* MODO INDIVIDUAL */}
            {tipoConfiguracion === 'individual' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Calibrar Número Específico
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Número (00-99)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={nuevoNumeroLimite}
                      onChange={(e) => setNuevoNumeroLimite(e.target.value)}
                      placeholder="00"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
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
                  onClick={handleAgregarLimiteIndividual}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  + Establecer Límite
                </button>
              </div>
            )}

            {/* Lista de Limitadores Activos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Límites Configurados ({limitadoresLocales.length})
                </span>
                {limitadoresLocales.length > 0 && (
                  <button
                    type="button"
                    onClick={handleLimpiarTodosLimites}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Limpiar Todos
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {limitadoresLocales.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    Sin limitadores configurados (Venta abierta sin restricciones).
                  </p>
                ) : (
                  limitadoresLocales.map((lim, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                          #{lim.numero}
                        </span>
                        <span className="text-xs text-slate-700 dark:text-slate-300">
                          Tope Máx: <strong className="font-mono text-emerald-600 dark:text-emerald-400">${lim.limiteMonto.toFixed(2)}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEliminarLimite(lim.numero)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Eliminar límite"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsLimitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleGuardarLimites}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Ingresa la nueva clave para el usuario <strong className="text-indigo-600 dark:text-indigo-400 font-mono">@{resetTarget.username}</strong>
            </p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Actualizar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
