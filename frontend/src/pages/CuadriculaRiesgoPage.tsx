import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CuadriculaRiesgoGlobal, NumeroCuadricula } from '../types/riesgo';
import { Sorteo } from '../types/sorteos';
import { Zona } from '../types/zonas';
import { Vendedor } from '../types/vendedores';
import { 
  ShieldAlert, 
  Lock, 
  Unlock,
  RefreshCw, 
  Loader2, 
  X,
  Calendar
} from 'lucide-react';
import { CustomSelect } from '../components/common/CustomSelect';
import { CustomDatePicker } from '../components/common/CustomDatePicker';
import { useToastStore } from '../store/useToastStore';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const CuadriculaRiesgoPage: React.FC = () => {
  const [todosLosSorteos, setTodosLosSorteos] = useState<Sorteo[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  
  // Filtros dinámicos
  const [selectedFecha, setSelectedFecha] = useState(() => getLocalDateString());
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState<number | null>(null);
  const [zonaFiltro, setZonaFiltro] = useState<string>('all');
  const [vendedorFiltro, setVendedorFiltro] = useState<string>('all');

  const [cuadriculaData, setCuadriculaData] = useState<CuadriculaRiesgoGlobal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Toast
  const toast = useToastStore();

  // Modal para Bloquear / Desbloquear Número
  const [numeroModal, setNumeroModal] = useState<NumeroCuadricula | null>(null);
  const [modalAlcance, setModalAlcance] = useState<'GLOBAL' | 'POR_ZONA' | 'POR_VENDEDOR'>('GLOBAL');
  const [modalZonaId, setModalZonaId] = useState<string>('');
  const [modalMotivo, setModalMotivo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [resSorteos, resZonas, resVendedores] = await Promise.all([
        api.get<Sorteo[]>('/sorteos'),
        api.get<Zona[]>('/zonas?soloActivas=true'),
        api.get<Vendedor[]>('/vendedores')
      ]);
      setTodosLosSorteos(resSorteos.data);
      setZonas(resZonas.data);
      setVendedores(resVendedores.data);
    } catch {
      toast.error('No se pudo cargar la lista de sorteos o catálogos.');
    }
  };

  // Filtrar los sorteos estrictamente por la fecha seleccionada
  const sorteosDeFecha = todosLosSorteos.filter(s => s.fecha === selectedFecha);

  // Cuando cambia la fecha o la lista de sorteos, auto-seleccionar sorteo de ese día
  useEffect(() => {
    if (sorteosDeFecha.length > 0) {
      const existe = sorteosDeFecha.find(s => s.id === sorteoSeleccionado);
      if (!existe) {
        const abierto = sorteosDeFecha.find(s => s.estado === 'ABIERTO') || sorteosDeFecha[0];
        setSorteoSeleccionado(abierto.id);
      }
    } else {
      setSorteoSeleccionado(null);
      setCuadriculaData(null);
    }
  }, [selectedFecha, todosLosSorteos]);

  // Recargar cuadrícula cuando cambian los filtros
  useEffect(() => {
    if (sorteoSeleccionado) {
      cargarCuadricula(
        sorteoSeleccionado,
        zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined,
        vendedorFiltro !== 'all' ? vendedorFiltro : undefined
      );
    }
  }, [sorteoSeleccionado, zonaFiltro, vendedorFiltro]);

  const cargarCuadricula = async (sorteoId: number, zId?: number, vId?: string) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (zId) params.zonaId = zId;
      if (vId) params.vendedorId = vId;

      const res = await api.get<CuadriculaRiesgoGlobal>(`/sorteos/${sorteoId}/cuadricula-global`, { params });
      setCuadriculaData(res.data);
    } catch {
      toast.error('Error al consultar la cuadrícula de riesgo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (celda: NumeroCuadricula) => {
    setNumeroModal(celda);
    setModalAlcance('GLOBAL');
    setModalZonaId(zonaFiltro !== 'all' ? zonaFiltro : (zonas[0]?.id.toString() || ''));
    setModalMotivo(celda.motivoBloqueo || 'Tope de riesgo preventivo');
  };

  const handleBloquearNumero = async () => {
    if (!sorteoSeleccionado || !numeroModal) return;
    setActionLoading(true);
    try {
      await api.post(`/sorteos/${sorteoSeleccionado}/bloquear-numero`, {
        numero: numeroModal.numero,
        alcance: modalAlcance,
        zonaId: modalAlcance === 'POR_ZONA' && modalZonaId ? Number(modalZonaId) : undefined,
        motivo: modalMotivo
      });

      toast.success(`Número #${numeroModal.numero} bloqueado exitosamente.`);
      setNumeroModal(null);
      await cargarCuadricula(
        sorteoSeleccionado,
        zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined,
        vendedorFiltro !== 'all' ? vendedorFiltro : undefined
      );
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'No se pudo bloquear el número.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDesbloquearNumero = async (numero: string) => {
    if (!sorteoSeleccionado) return;
    setActionLoading(true);
    try {
      await api.delete(`/sorteos/${sorteoSeleccionado}/bloquear-numero/${numero}`);
      toast.success(`Número #${numero} desbloqueado exitosamente.`);
      setNumeroModal(null);
      await cargarCuadricula(
        sorteoSeleccionado,
        zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined,
        vendedorFiltro !== 'all' ? vendedorFiltro : undefined
      );
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'No se pudo desbloquear el número.');
    } finally {
      setActionLoading(false);
    }
  };

  // Generar datos 00 a 99
  const celdasMap = new Map<string, NumeroCuadricula>();
  if (cuadriculaData?.cuadricula) {
    cuadriculaData.cuadricula.forEach(n => celdasMap.set(n.numero, n));
  }

  const todasLasCeldas: NumeroCuadricula[] = [];
  for (let i = 0; i < 100; i++) {
    const numStr = i.toString().padStart(2, '0');
    todasLasCeldas.push(
      celdasMap.get(numStr) || {
        numero: numStr,
        totalVendido: 0,
        cantidadJugadas: 0,
        riesgoEstimadoPremio: 0,
        estaBloqueado: false
      }
    );
  }

  const sorteoOptions = sorteosDeFecha.map((s) => ({
    value: s.id,
    label: `${s.codigo} - ${s.horarioNombre || 'Sorteo'}`,
    sublabel: s.estado
  }));

  const zonaOptions = [
    { value: 'all', label: 'Todas las Zonas (Consolidado)' },
    ...zonas.map((z) => ({ value: z.id.toString(), label: z.nombre, sublabel: `x${Number(z.coeficientePremio).toFixed(0)}` }))
  ];

  const vendedorOptions = [
    { value: 'all', label: 'Todos los Vendedores' },
    ...vendedores.map((v) => ({ value: v.id, label: `${v.nombres} ${v.apellidos}`.trim() || v.username, sublabel: v.zonaNombre || 'General' }))
  ];

  const totalBloqueados = cuadriculaData?.cuadricula?.filter(c => c.estaBloqueado).length || 0;

  return (
    <div className="space-y-2.5">
      {/* 1. Barra de Control con Filtros Dinámicos Integrados */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        {/* Filtros: Fecha + Sorteo + Zona + Vendedor */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mr-1 shrink-0">
            <ShieldAlert className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm font-black tracking-tight">Cuadrícula 00-99</span>
          </div>

          {/* Selector de Fecha */}
          <div className="w-36">
            <CustomDatePicker
              value={selectedFecha}
              onChange={(f) => setSelectedFecha(f)}
              placeholder="Fecha"
            />
          </div>

          {/* Selector de Sorteo (Solo muestra sorteos de la fecha seleccionada) */}
          <div className="w-52">
            <CustomSelect
              options={sorteoOptions}
              value={sorteoSeleccionado || ''}
              onChange={(val) => setSorteoSeleccionado(Number(val))}
              placeholder={sorteosDeFecha.length === 0 ? "Sin sorteos en fecha" : "Seleccionar Turno"}
            />
          </div>

          {/* Selector de Zona */}
          <div className="w-44">
            <CustomSelect
              options={zonaOptions}
              value={zonaFiltro}
              onChange={(val) => setZonaFiltro(val)}
              placeholder="Filtrar por Zona"
            />
          </div>

          {/* Selector de Vendedor */}
          <div className="w-44">
            <CustomSelect
              options={vendedorOptions}
              value={vendedorFiltro}
              onChange={(val) => setVendedorFiltro(val)}
              placeholder="Filtrar por Vendedor"
            />
          </div>
        </div>

        {/* Métricas Resumidas + Botón Actualizar */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
            <span className="text-slate-500 uppercase font-bold mr-1">Venta:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              ${cuadriculaData?.ventaTotalAcumulada?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) || '0'}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 font-mono text-[11px]">
            <span className="text-rose-500 uppercase font-bold mr-1">Exposición:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              ${cuadriculaData?.riesgoTotalEstimado?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) || '0'}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
            <span className="text-slate-500 uppercase font-bold mr-1">Bloqueados:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{totalBloqueados}/100</span>
          </div>

          <button
            onClick={() => sorteoSeleccionado && cargarCuadricula(
              sorteoSeleccionado,
              zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined,
              vendedorFiltro !== 'all' ? vendedorFiltro : undefined
            )}
            disabled={isLoading || !sorteoSeleccionado}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* 2. Cuadrícula EXACTA con Bordes Sólidos Bien Marcados */}
      {sorteosDeFecha.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-14 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Calendar className="w-10 h-10 text-slate-400 mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No hay turnos para {selectedFecha}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Selecciona otra fecha en el calendario o genera los turnos oficiales en Sorteos y Horarios.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
          <span className="text-xs font-semibold">Cargando matriz de riesgo...</span>
        </div>
      ) : (
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border-2 border-black dark:border-slate-500 p-1 shadow-md overflow-hidden">
          <table className="w-full border-collapse border-2 border-black dark:border-slate-500 table-fixed select-none">
            <tbody>
              {Array.from({ length: 25 }, (_, rowIndex) => {
                // Las 4 columnas: 00-24, 25-49, 50-74, 75-99
                const colIndices = [rowIndex, 25 + rowIndex, 50 + rowIndex, 75 + rowIndex];
                return (
                  <tr key={rowIndex} className="h-[21px] max-h-[22px] leading-none border-b border-black dark:border-slate-500 hover:bg-cyan-50/20 transition-colors">
                    {colIndices.map((numIdx, cIndex) => {
                      const celda = todasLasCeldas[numIdx];
                      const isBloqueado = celda.estaBloqueado;
                      const hasBet = celda.totalVendido > 0;
                      const isLastCol = cIndex === 3;

                      return (
                        <React.Fragment key={celda.numero}>
                          {/* Subcolumna 1: Número (Fondo Sólido Cyan, Texto Negro Bold Centrado, Borde derecho sólido) */}
                          <td
                            onClick={() => handleOpenModal(celda)}
                            className="w-[45px] text-center font-black text-xs font-mono border-r-2 border-black dark:border-slate-500 cursor-pointer bg-[#00BCD4] text-black hover:opacity-85 transition-opacity px-1 py-0.5 select-none"
                            title={`Número #${celda.numero} - Haz clic para gestionar bloqueo/tope`}
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              {isBloqueado && <Lock className="w-2.5 h-2.5 text-red-600 shrink-0" />}
                              <span>{celda.numero}</span>
                            </div>
                          </td>

                          {/* Subcolumna 2: Monto Apostado (Texto Rojo Bold, Vacío si es 0, Borde separador entre bloques de columnas) */}
                          <td
                            onClick={() => handleOpenModal(celda)}
                            className={`text-center font-black text-xs font-mono cursor-pointer bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors px-1 py-0.5 select-none ${
                              !isLastCol ? 'border-r-2 border-black dark:border-slate-500' : ''
                            }`}
                            title={hasBet ? `Apostado: $${celda.totalVendido.toFixed(2)} | Riesgo: $${celda.riesgoEstimadoPremio.toFixed(0)}` : `Número #${celda.numero} sin apuestas`}
                          >
                            {hasBet ? Math.round(celda.totalVendido) : ''}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Bloquear / Desbloquear Número */}
      {numeroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-xl bg-[#00BCD4] text-black font-black text-lg flex items-center justify-center font-mono shadow-sm">
                  {numeroModal.numero}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Gestión de Riesgo #{numeroModal.numero}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Apostado en filtro: <strong className="font-mono text-slate-700 dark:text-slate-300">${numeroModal.totalVendido.toFixed(2)}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNumeroModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {numeroModal.estaBloqueado ? (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Este número se encuentra actualmente bloqueado para ventas.</span>
                  </div>
                  {numeroModal.motivoBloqueo && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Motivo: <em>"{numeroModal.motivoBloqueo}"</em>
                    </p>
                  )}

                  <button
                    onClick={() => handleDesbloquearNumero(numeroModal.numero)}
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                    Desbloquear y Permitir Ventas
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Alcance del Bloqueo
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModalAlcance('GLOBAL')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          modalAlcance === 'GLOBAL'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        Global (Todas las Zonas)
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalAlcance('POR_ZONA')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          modalAlcance === 'POR_ZONA'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        Por Sucursal Específica
                      </button>
                    </div>
                  </div>

                  {modalAlcance === 'POR_ZONA' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Sucursal Afectada
                      </label>
                      <CustomSelect
                        options={zonas.map(z => ({ value: z.id.toString(), label: z.nombre }))}
                        value={modalZonaId}
                        onChange={(val) => setModalZonaId(val)}
                        placeholder="Seleccionar Sucursal"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Motivo del Bloqueo
                    </label>
                    <input
                      type="text"
                      value={modalMotivo}
                      onChange={(e) => setModalMotivo(e.target.value)}
                      placeholder="ej. Tope financiero alcanzado"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setNumeroModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleBloquearNumero}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Confirmar Bloqueo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
