import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LiquidacionSorteo } from '../types/liquidacion';
import { Sorteo } from '../types/sorteos';
import { 
  Trophy, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Users, 
  FileText, 
  AlertTriangle, 
  X, 
  RefreshCw,
  Edit3,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { CustomSelect } from '../components/common/CustomSelect';
import { useToastStore } from '../store/useToastStore';

export const LiquidacionPage: React.FC = () => {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState<number | null>(null);
  const [liquidacionData, setLiquidacionData] = useState<LiquidacionSorteo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Toast
  const toast = useToastStore();

  // Modal para Ingresar / Rectificar Ganador
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'input' | 'confirm'>('input');
  const [numeroGanadorInput, setNumeroGanadorInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRectificacion, setIsRectificacion] = useState(false);

  useEffect(() => {
    cargarSorteos();
  }, []);

  useEffect(() => {
    if (sorteoSeleccionado) {
      cargarLiquidacion(sorteoSeleccionado);
    }
  }, [sorteoSeleccionado]);

  const cargarSorteos = async () => {
    try {
      const res = await api.get<Sorteo[]>('/sorteos');
      setSorteos(res.data);
      if (res.data.length > 0) {
        const liq = res.data.find(s => s.estado === 'LIQUIDADO') || res.data[0];
        setSorteoSeleccionado(liq.id);
      }
    } catch {
      toast.error('Error al cargar la lista de sorteos.');
    }
  };

  const cargarLiquidacion = async (sorteoId: number) => {
    setIsLoading(true);
    setLiquidacionData(null);
    try {
      const res = await api.get<LiquidacionSorteo>(`/sorteos/${sorteoId}/liquidacion`);
      setLiquidacionData(res.data);
    } catch {
      setLiquidacionData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenLiquidarModal = (rectificar = false) => {
    setIsRectificacion(rectificar);
    setModalStep('input');
    if (rectificar && liquidacionData?.numeroGanador) {
      setNumeroGanadorInput(liquidacionData.numeroGanador);
    } else {
      setNumeroGanadorInput('');
    }
    setModalOpen(true);
  };

  const handlePasoConfirmacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroGanadorInput || !/^[0-9]{2}$/.test(numeroGanadorInput)) {
      toast.error('El número ganador debe ser de dos dígitos entre 00 y 99.');
      return;
    }
    setModalStep('confirm');
  };

  const handleEjecutarLiquidacion = async () => {
    if (!sorteoSeleccionado || !numeroGanadorInput) return;

    setIsSubmitting(true);
    try {
      const res = await api.post<LiquidacionSorteo>(`/sorteos/${sorteoSeleccionado}/liquidar`, {
        numeroGanador: numeroGanadorInput
      });

      setLiquidacionData(res.data);
      toast.success(
        isRectificacion 
          ? `Número ganador rectificado a #${numeroGanadorInput}. Cálculos actualizados.` 
          : `Sorteo liquidado con éxito. Ganador oficial: #${numeroGanadorInput}`
      );
      setModalOpen(false);
      setNumeroGanadorInput('');
      await cargarSorteos();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al procesar la liquidación del sorteo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sorteoActual = sorteos.find(s => s.id === sorteoSeleccionado);

  const sorteoOptions = sorteos.map((s) => ({
    value: s.id,
    label: `${s.codigo} - ${s.horarioNombre || 'Sorteo'} (${s.fecha})`,
    sublabel: s.numeroGanador ? `Ganador: #${s.numeroGanador}` : s.estado
  }));

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Cierre Oficial y Liquidación Financiera
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Declaración del número ganador, balance de comisiones y reporte de rentabilidad neta
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {sorteoActual && sorteoActual.estado !== 'LIQUIDADO' && (
            <button
              onClick={() => handleOpenLiquidarModal(false)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Award className="w-4 h-4" />
              Ingresar Ganador y Liquidar
            </button>
          )}

          {sorteoActual && sorteoActual.estado === 'LIQUIDADO' && (
            <button
              onClick={() => handleOpenLiquidarModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              Rectificar Número Ganador
            </button>
          )}

          <button
            onClick={() => sorteoSeleccionado && cargarLiquidacion(sorteoSeleccionado)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Selector de Sorteo con CustomSelect */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-96">
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Sorteo a Liquidar o Consultar
          </label>
          <CustomSelect
            options={sorteoOptions}
            value={sorteoSeleccionado || ''}
            onChange={(val) => setSorteoSeleccionado(Number(val))}
            placeholder="Seleccionar Sorteo"
          />
        </div>

        {sorteoActual && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-500 dark:text-slate-400">Estado:</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              sorteoActual.estado === 'LIQUIDADO'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
            }`}>
              {sorteoActual.estado === 'LIQUIDADO' ? 'LIQUIDADO' : 'PENDIENTE DE GANADOR'}
            </span>
          </div>
        )}
      </div>

      {/* Resultados de la Liquidación */}
      {isLoading ? (
        <div className="py-20 flex justify-center items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : liquidacionData ? (
        <div className="space-y-6">
          {/* Tarjeta de Ganador y Resumen Económico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Número Ganador</span>
              <div className="text-4xl font-mono font-black text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-500/10 px-5 py-2 rounded-xl border border-amber-200 dark:border-amber-500/30">
                #{liquidacionData.numeroGanador}
              </div>
              <span className="text-[10px] text-slate-400 mt-2 font-medium">Oficial Declarado</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Venta Bruta</span>
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                ${liquidacionData.ventaTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Boletos activos</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Premios</span>
                <Award className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                ${liquidacionData.premioTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Premios a entregar</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Comisiones</span>
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                ${liquidacionData.comisionVendedoresTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pago a vendedores</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Utilidad Neta</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className={`text-2xl font-black font-mono ${liquidacionData.gananciaNetaEmpresa >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                ${liquidacionData.gananciaNetaEmpresa.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Margen final</p>
            </div>
          </div>

          {/* Tabla de Liquidación por Vendedor */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Detalle de Balances por Vendedor
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Desglose de recaudación, comisión devengada y premios validados en punto
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {liquidacionData.desgloseVendedores?.length || 0} Puntos de Venta
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Vendedor</th>
                    <th className="py-3 px-4">Venta Total</th>
                    <th className="py-3 px-4">Comisión Ganada</th>
                    <th className="py-3 px-4">Premios en Punto</th>
                    <th className="py-3 px-4 text-right">Balance a Entregar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {liquidacionData.desgloseVendedores?.map((det) => (
                    <tr key={det.vendedorId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {det.nombreVendedor}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        ${det.ventaVendedor.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        +${det.comisionVendedor.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-rose-600 dark:text-rose-400">
                        -${det.premiosEnPunto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-slate-900 dark:text-white">
                        ${det.balanceNeto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <FileText className="w-12 h-12 text-slate-400 mb-3" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Sorteo Pendiente de Liquidación</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Este sorteo no ha sido oficializado con un número ganador. Ingresa el número ganador oficial para generar el reporte de premios y balances.
          </p>
          <button
            onClick={() => handleOpenLiquidarModal(false)}
            className="mt-4 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Ingresar Ganador y Liquidar
          </button>
        </div>
      )}

      {/* MODAL PERSONALIZADO (SIN CONFIRM NATIVO DEL NAVEGADOR) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isRectificacion ? 'Rectificar Número Ganador' : 'Declarar Ganador Oficial'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PASO 1: Ingreso de Número */}
            {modalStep === 'input' && (
              <form onSubmit={handlePasoConfirmacion} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                    Número Ganador Oficial (00 al 99)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    autoFocus
                    value={numeroGanadorInput}
                    onChange={(e) => setNumeroGanadorInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="77"
                    className="w-full text-center text-4xl font-mono font-black tracking-widest bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-amber-600 dark:text-amber-400 rounded-xl p-3 focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                    Ingresa exactamente 2 dígitos emitidos por el sorteo oficial.
                  </p>
                </div>

                {isRectificacion && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      Rectificación de Ganador
                    </p>
                    <p className="mt-1">
                      Al cambiar el número ganador, el sistema recalculará automáticamente los premios y comisiones de los vendedores.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={numeroGanadorInput.length !== 2}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* PASO 2: Confirmación Directa en la UI */}
            {modalStep === 'confirm' && (
              <div className="mt-4 space-y-4">
                <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Confirmar Declaración Oficial
                  </span>
                  <div className="text-5xl font-mono font-black text-amber-600 dark:text-amber-400">
                    #{numeroGanadorInput}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    ¿Confirmas declarar el número oficial <strong className="font-mono">#{numeroGanadorInput}</strong> para el sorteo <strong className="font-mono">{sorteoActual?.codigo}</strong>?
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Acciones que se ejecutarán:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    <li>Premiación inmediata de boletos ganadores.</li>
                    <li>Cálculo de comisiones por porcentaje a los vendedores.</li>
                    <li>Cierre contable de caja para este horario.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalStep('input')}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Volver a corregir
                  </button>
                  <button
                    type="button"
                    onClick={handleEjecutarLiquidacion}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Confirmar y Liquidar Sorteo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
