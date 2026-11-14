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
  CheckCircle, 
  X, 
  RefreshCw,
  Calculator
} from 'lucide-react';

export const LiquidacionPage: React.FC = () => {
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState<number | null>(null);
  const [liquidacionData, setLiquidacionData] = useState<LiquidacionSorteo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal para Ingresar Ganador y Liquidar Sorteo
  const [modalOpen, setModalOpen] = useState(false);
  const [numeroGanadorInput, setNumeroGanadorInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setError('Error al cargar la lista de sorteos.');
    }
  };

  const cargarLiquidacion = async (sorteoId: number) => {
    setIsLoading(true);
    setError(null);
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

  const handleLiquidarSorteo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sorteoSeleccionado || !numeroGanadorInput) return;

    if (!/^[0-9]{2}$/.test(numeroGanadorInput)) {
      setError('El número ganador debe ser exactamente de dos dígitos entre 00 y 99.');
      return;
    }

    if (!confirm(`¿Confirmas declarar el número oficial ${numeroGanadorInput}? Esta acción premiará los boletos y calculará la liquidación de los vendedores.`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post<LiquidacionSorteo>(`/sorteos/${sorteoSeleccionado}/liquidar`, {
        numeroGanador: numeroGanadorInput
      });

      setLiquidacionData(res.data);
      setMensajeExito(`Sorteo liquidado con éxito. Número Ganador Oficial: ${numeroGanadorInput}`);
      setModalOpen(false);
      setNumeroGanadorInput('');
      await cargarSorteos();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al procesar la liquidación del sorteo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sorteoActual = sorteos.find(s => s.id === sorteoSeleccionado);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Cierre Oficial de Sorteos y Liquidación Financiera
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
            Ingreso del número ganador oficial (00-99), cálculo de premios, rentabilidad y comisiones de vendedores.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {sorteoActual && sorteoActual.estado !== 'LIQUIDADO' && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Award className="w-4 h-4" />
              Ingresar Ganador y Liquidar
            </button>
          )}

          <button
            onClick={() => sorteoSeleccionado && cargarLiquidacion(sorteoSeleccionado)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors text-xs font-semibold"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {mensajeExito && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Selector de Sorteo con dropdown estilizado */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Seleccionar Sorteo:</span>
          <select
            value={sorteoSeleccionado || ''}
            onChange={(e) => setSorteoSeleccionado(Number(e.target.value))}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
          >
            {sorteos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.codigo} - {s.fecha} [{s.estado}] {s.numeroGanador ? `(Ganador: ${s.numeroGanador})` : ''}
              </option>
            ))}
          </select>
        </div>

        {sorteoActual && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Estado:</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              sorteoActual.estado === 'LIQUIDADO'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30'
            }`}>
              {sorteoActual.estado}
            </span>
          </div>
        )}
      </div>

      {/* Resultados de la Liquidación */}
      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : liquidacionData ? (
        <div className="space-y-6">
          {/* Tarjeta de Ganador y Resumen Económico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Número Ganador</span>
              <div className="text-5xl font-mono font-black text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-500/10 px-5 py-2 rounded-xl border border-amber-200 dark:border-amber-500/30">
                {liquidacionData.numeroGanador}
              </div>
              <span className="text-[10px] text-slate-400 mt-2">Oficial Registrado</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Venta Bruta Total</span>
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                ${liquidacionData.ventaTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Boletos activos</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Premios</span>
                <Award className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                ${liquidacionData.premioTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Premios a entregar</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Comisión Vendedores</span>
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                ${liquidacionData.comisionVendedoresTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Margen comercial</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Ganancia Neta Empresa</span>
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className={`text-2xl font-black ${liquidacionData.gananciaNetaEmpresa >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                ${liquidacionData.gananciaNetaEmpresa.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Resultado final</p>
            </div>
          </div>

          {/* Tabla de Desglose por Vendedor */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Liquidación Individual por Vendedor
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {liquidacionData.desgloseVendedores.length} vendedores participantes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Vendedor</th>
                    <th className="px-4 py-3">Zona</th>
                    <th className="px-4 py-3 text-right">Venta Emitida</th>
                    <th className="px-4 py-3 text-right">Comisión</th>
                    <th className="px-4 py-3 text-right">Premios en Punto</th>
                    <th className="px-4 py-3 text-right">Balance Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {liquidacionData.desgloseVendedores.map((v) => (
                    <tr key={v.vendedorId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{v.nombreVendedor}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Usuario: {v.codigoVendedor}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{v.zonaNombre}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900 dark:text-white">
                        ${v.ventaVendedor.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-indigo-600 dark:text-indigo-400">
                        ${v.comisionVendedor.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-red-600 dark:text-red-400">
                        ${v.premiosEnPunto.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${v.balanceNeto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        ${v.balanceNeto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {liquidacionData.desgloseVendedores.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No se registraron ventas en este sorteo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Sorteo Pendiente de Liquidación</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Este sorteo aún no ha sido cerrado oficialmente con el número ganador. Presiona el botón "Ingresar Ganador y Liquidar" para ejecutar la liquidación y generar los reportes contables.
          </p>
          {sorteoActual && sorteoActual.estado !== 'LIQUIDADO' && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Award className="w-4 h-4" />
              Ingresar Número Ganador Ahora
            </button>
          )}
        </div>
      )}

      {/* Modal de Ingreso de Ganador Oficial */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Declarar Ganador Oficial</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLiquidarSorteo} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                  Número Ganador Oficial (00 al 99)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  required
                  value={numeroGanadorInput}
                  onChange={(e) => setNumeroGanadorInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 77"
                  className="w-full text-center text-4xl font-mono font-bold tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-400 rounded-xl p-3 focus:border-amber-500 focus:outline-none"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                  Introduce el número de dos dígitos emitido por el sorteo.
                </p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  Operación Contable Crítica
                </span>
                <p>
                  Al confirmar, el sistema premiará las jugadas ganadoras y calculará los balances de venta en las cuentas de los vendedores.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || numeroGanadorInput.length !== 2}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Confirmar y Liquidar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
