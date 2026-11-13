import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Wallet, 
  KeyRound, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  X,
  CreditCard
} from 'lucide-react';
import { api } from '../services/api';
import { Vendedor } from '../types/vendedores';
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
  const [precioBase, setPrecioBase] = useState('15');
  const [precioVenta, setPrecioVenta] = useState('20');
  const [saldoInicial, setSaldoInicial] = useState('500');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal: Recargar Saldo
  const [isSaldoModalOpen, setIsSaldoModalOpen] = useState(false);
  const [saldoTarget, setSaldoTarget] = useState<Vendedor | null>(null);
  const [montoRecarga, setMontoRecarga] = useState('500');
  const [conceptoRecarga, setConceptoRecarga] = useState('');

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
      setError('Error al cargar la información de vendedores y zonas.');
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
      const term = searchTerm.toLowerCase();
      result = result.filter(v =>
        v.nombres.toLowerCase().includes(term) ||
        v.apellidos.toLowerCase().includes(term) ||
        v.cedula.toLowerCase().includes(term) ||
        v.username.toLowerCase().includes(term)
      );
    }

    if (filterZona !== 'all') {
      const zId = parseInt(filterZona);
      result = result.filter(v => v.zonaId === zId);
    }

    setFilteredVendedores(result);
  }, [searchTerm, filterZona, vendedores]);

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
    setPrecioBase('15');
    setPrecioVenta('20');
    setSaldoInicial('500');
    if (zonas.length > 0) setZonaId(zonas[0].id);
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
    setZonaId(v.zonaId);
    setPrecioBase(v.precioBase.toString());
    setPrecioVenta(v.precioVenta.toString());
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const pb = parseFloat(precioBase);
    const pv = parseFloat(precioVenta);
    const si = parseFloat(saldoInicial);

    if (pv < pb) {
      setFormError('El precio de venta debe ser mayor o igual al precio base.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (formMode === 'create') {
        await api.post('/vendedores', {
          cedula: cedula.trim(),
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          celular: celular.trim() || null,
          direccion: direccion.trim() || null,
          username: username.trim(),
          password,
          zonaId,
          precioBase: pb,
          precioVenta: pv,
          saldoInicial: si || 0
        });
        setSuccessMessage('Vendedor dado de alta con éxito en el sistema.');
      } else if (selectedVendedorId) {
        await api.put(`/vendedores/${selectedVendedorId}`, {
          cedula: cedula.trim(),
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          celular: celular.trim() || null,
          direccion: direccion.trim() || null,
          zonaId,
          precioBase: pb,
          precioVenta: pv
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

  const handleRecargarSaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saldoTarget) return;

    const monto = parseFloat(montoRecarga);
    if (isNaN(monto) || monto === 0) {
      setFormError('Monto de recarga inválido.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.patch(`/vendedores/${saldoTarget.id}/saldo`, {
        monto,
        concepto: conceptoRecarga.trim() || 'Recarga de saldo operativo por Administrador'
      });
      setSuccessMessage(`Saldo recargado a ${saldoTarget.nombres}: +$${monto.toFixed(2)}`);
      setIsSaldoModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al procesar la recarga de saldo.');
      setTimeout(() => setError(null), 4000);
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

  const totalSaldoColocado = vendedores.reduce((acc, v) => acc + Number(v.saldoCredito), 0);
  const vendedoresActivos = vendedores.filter(v => v.estado).length;
  const currentSelectedZona = zonas.find(z => z.id === zonaId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            Control de Personal y Finanzas (CU02)
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">Gestión de Vendedores</h2>
          <p className="text-xs text-slate-400 mt-1">
            Registra operadores de calle, asigna su sucursal, calibra comisiones (Precio Base vs Venta) y administra saldo operativo.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo Vendedor
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vendedores Activos</span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-white">{vendedoresActivos}</h3>
            <span className="text-xs text-slate-400">de {vendedores.length} registrados</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Total en Calle</span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-emerald-400">${totalSaldoColocado.toFixed(2)}</h3>
            <span className="text-xs text-slate-400">Límite operativo</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sucursales Activas</span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-indigo-400">{zonas.length}</h3>
            <span className="text-xs text-slate-400">Zonas con multiplicador</span>
          </div>
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
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por cédula, nombre o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterZona}
            onChange={(e) => setFilterZona(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todas las Zonas</option>
            {zonas.map(z => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-sm">Cargando vendedores...</span>
          </div>
        ) : filteredVendedores.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="w-10 h-10 text-slate-600 mb-3" />
            <h4 className="text-sm font-bold text-white">No se encontraron vendedores</h4>
            <p className="text-xs text-slate-400 mt-1">Registra tu primer vendedor para habilitar la App Móvil.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Vendedor</th>
                  <th className="py-3.5 px-4">Usuario / Cédula</th>
                  <th className="py-3.5 px-4">Sucursal Asignada</th>
                  <th className="py-3.5 px-4">Comisión (Venta - Base)</th>
                  <th className="py-3.5 px-4">Saldo Crédito</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredVendedores.map((v) => {
                  const comision = Number(v.precioVenta) - Number(v.precioBase);
                  return (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {v.nombres.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white truncate">{v.nombres} {v.apellidos}</p>
                            <p className="text-[11px] text-slate-400">{v.celular || 'Sin celular'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-mono text-indigo-300 font-semibold">{v.username}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{v.cedula}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200">{v.zonaNombre}</span>
                        <div className="text-[10px] text-indigo-400 font-mono">
                          x{Number(v.coeficientePremio).toFixed(2)} Coef.
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-emerald-400 font-bold">+${comision.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-500">(${Number(v.precioVenta).toFixed(0)}/${Number(v.precioBase).toFixed(0)})</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                          <Wallet className="w-3.5 h-3.5" />
                          ${Number(v.saldoCredito).toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleEstado(v)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                            v.estado
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          {v.estado ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {v.estado ? 'Activo' : 'Suspendido'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSaldoTarget(v);
                              setMontoRecarga('500');
                              setConceptoRecarga('');
                              setIsSaldoModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="Recargar Saldo"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setResetTarget(v);
                              setNewPassword('');
                              setIsResetModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Resetear Contraseña"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(v)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Editar Vendedor"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear / Editar Vendedor */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {formMode === 'create' ? 'Registrar Nuevo Vendedor' : 'Editar Perfil de Vendedor'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
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

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Cédula</label>
                  <input
                    type="text"
                    placeholder="001-000000-0000A"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+505 8888-8888"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Nombres</label>
                  <input
                    type="text"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {formMode === 'create' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Usuario App</label>
                    <input
                      type="text"
                      placeholder="vendedor1"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Contraseña Inicial</label>
                    <input
                      type="password"
                      placeholder="mínimo 6 carácteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Zona & Coeficiente */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Sucursal / Zona Comercial (Hereda Coeficiente)
                </label>
                <select
                  value={zonaId}
                  onChange={(e) => setZonaId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {zonas.map(z => (
                    <option key={z.id} value={z.id}>{z.nombre} (Multiplicador x{Number(z.coeficientePremio).toFixed(2)})</option>
                  ))}
                </select>
                {currentSelectedZona && (
                  <p className="mt-1 text-[11px] text-indigo-400 font-medium">
                    Multiplicador activo de esta zona: <span className="font-bold font-mono">x{Number(currentSelectedZona.coeficientePremio).toFixed(2)}</span>
                  </p>
                )}
              </div>

              {/* Parámetros Financieros */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Esquema Financiero y Comisiones</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Precio Base</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={precioBase}
                      onChange={(e) => setPrecioBase(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Precio Venta</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Ganancia estimada por unidad:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    +${(parseFloat(precioVenta || '0') - parseFloat(precioBase || '0')).toFixed(2)}
                  </span>
                </div>

                {formMode === 'create' && (
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">Saldo de Crédito Inicial ($)</label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={saldoInicial}
                      onChange={(e) => setSaldoInicial(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {formMode === 'create' ? 'Dar de Alta' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Recargar Saldo */}
      {isSaldoModalOpen && saldoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Recargar Saldo Operativo
              </h3>
              <button
                onClick={() => setIsSaldoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecargarSaldo} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">{saldoTarget.nombres} {saldoTarget.apellidos}</p>
                  <p className="text-slate-400 font-mono text-[11px]">{saldoTarget.username}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Saldo Actual</span>
                  <span className="font-mono font-bold text-emerald-400">${Number(saldoTarget.saldoCredito).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Monto a Recargar ($)
                </label>
                <input
                  type="number"
                  step="50"
                  min="1"
                  value={montoRecarga}
                  onChange={(e) => setMontoRecarga(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Concepto / Observación
                </label>
                <input
                  type="text"
                  placeholder="ej. Recarga de turno matutino"
                  value={conceptoRecarga}
                  onChange={(e) => setConceptoRecarga(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                <span>Nuevo Saldo Proyectado:</span>
                <span className="font-mono font-bold text-sm">
                  ${(Number(saldoTarget.saldoCredito) + parseFloat(montoRecarga || '0')).toFixed(2)}
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSaldoModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirmar Recarga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {isResetModalOpen && resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Resetear Contraseña de Vendedor
              </h3>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <p className="text-xs text-slate-300">
                Estás restableciendo las credenciales para <strong className="text-white">{resetTarget.nombres} ({resetTarget.username})</strong>.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  placeholder="mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
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
