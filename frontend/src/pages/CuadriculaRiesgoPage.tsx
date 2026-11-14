import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CuadriculaRiesgoGlobal, NumeroCuadricula } from '../types/riesgo';
import { Sorteo } from '../types/sorteos';
import { Zona } from '../types/zonas';
import { 
  ShieldAlert, 
  Lock, 
  Unlock,
  RefreshCw, 
  Loader2, 
  X
} from 'lucide-react';
import { CustomSelect } from '../components/common/CustomSelect';
import { useToastStore } from '../store/useToastStore';

export const CuadriculaRiesgoPage: React.FC = () => {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState<number | null>(null);
  const [zonaFiltro, setZonaFiltro] = useState<string>('all');
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
    cargarSorteosYZonas();
  }, []);

  useEffect(() => {
    if (sorteoSeleccionado) {
      cargarCuadricula(sorteoSeleccionado, zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined);
    }
  }, [sorteoSeleccionado, zonaFiltro]);

  const cargarSorteosYZonas = async () => {
    try {
      const [resSorteos, resZonas] = await Promise.all([
        api.get<Sorteo[]>('/sorteos'),
        api.get<Zona[]>('/zonas?soloActivas=true')
      ]);
      setSorteos(resSorteos.data);
      setZonas(resZonas.data);
      if (resSorteos.data.length > 0) {
        const abierto = resSorteos.data.find(s => s.estado === 'ABIERTO') || resSorteos.data[0];
        setSorteoSeleccionado(abierto.id);
      }
    } catch {
      toast.error('No se pudo cargar la lista de sorteos o zonas.');
    }
  };

  const cargarCuadricula = async (sorteoId: number, zId?: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (zId) params.zonaId = zId;

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
      await cargarCuadricula(sorteoSeleccionado, zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined);
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
      await cargarCuadricula(sorteoSeleccionado, zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined);
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

  const sorteoOptions = sorteos.map((s) => ({
    value: s.id,
    label: `${s.codigo} - ${s.horarioNombre || 'Sorteo'}`,
    sublabel: s.estado
  }));

  const zonaOptions = [
    { value: 'all', label: 'Todas las Zonas' },
    ...zonas.map((z) => ({ value: z.id.toString(), label: z.nombre, sublabel: `x${Number(z.coeficientePremio).toFixed(2)}` }))
  ];

  const totalBloqueados = cuadriculaData?.cuadricula?.filter(c => c.estaBloqueado).length || 0;

  return (
    <div className="space-y-2.5">
      {/* Barra de Control Compacta e Integrada (Zero vertical waste para que no haya scroll) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        {/* Izquierda: Título y Selectores */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mr-2 shrink-0">
            <ShieldAlert className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm font-black tracking-tight">Cuadrícula 00-99</span>
          </div>

          <div className="w-52">
            <CustomSelect
              options={sorteoOptions}
              value={sorteoSeleccionado || ''}
              onChange={(val) => setSorteoSeleccionado(Number(val))}
              placeholder="Seleccionar Sorteo"
            />
          </div>

          <div className="w-44">
            <CustomSelect
              options={zonaOptions}
              value={zonaFiltro}
              onChange={(val) => setZonaFiltro(val)}
              placeholder="Filtrar por Zona"
            />
          </div>
        </div>

        {/* Centro / Derecha: Chips de Métricas y Botón Actualizar */}
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
            onClick={() => sorteoSeleccionado && cargarCuadricula(sorteoSeleccionado, zonaFiltro !== 'all' ? Number(zonaFiltro) : undefined)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Cuadrícula EXACTA: 4 Columnas x 25 Filas, estilo idéntico al solicitado */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400 gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
          <span className="text-xs font-semibold">Cargando matriz...</span>
        </div>
      ) : (
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border-2 border-black dark:border-slate-600 p-1 shadow-sm overflow-hidden">
          <table className="w-full border-collapse border border-black dark:border-slate-600 table-fixed select-none">
            <tbody>
              {Array.from({ length: 25 }, (_, rowIndex) => {
                // Las 4 columnas: 00-24, 25-49, 50-74, 75-99
                const colIndices = [rowIndex, 25 + rowIndex, 50 + rowIndex, 75 + rowIndex];
                return (
                  <tr key={rowIndex} className="h-[21px] max-h-[22px] leading-none">
                    {colIndices.map((numIdx) => {
                      const celda = todasLasCeldas[numIdx];
                      const isBloqueado = celda.estaBloqueado;
                      const hasBet = celda.totalVendido > 0;

                      return (
                        <React.Fragment key={celda.numero}>
                          {/* Subcolumna 1: Número (Fondo Sólido Cyan, Texto Negro Bold Centrado) */}
                          <td
                            onClick={() => handleOpenModal(celda)}
                            className="w-[45px] text-center font-black text-xs font-mono border border-black dark:border-slate-500 cursor-pointer bg-[#00BCD4] text-black hover:opacity-85 transition-opacity px-1 py-0.5 select-none"
                            title={`Número #${celda.numero} - Haz clic para gestionar bloqueo/tope`}
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              {isBloqueado && <Lock className="w-2.5 h-2.5 text-red-600 shrink-0" />}
                              <span>{celda.numero}</span>
                            </div>
                          </td>

                          {/* Subcolumna 2: Monto Apostado (Texto Rojo Bold, Vacío si es 0) */}
                          <td
                            onClick={() => handleOpenModal(celda)}
                            className="text-center font-black text-xs font-mono border border-black dark:border-slate-500 cursor-pointer bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors px-1 py-0.5 select-none"
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
                    Apostado: <strong className="font-mono text-slate-700 dark:text-slate-300">${numeroModal.totalVendido.toFixed(2)}</strong>
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
