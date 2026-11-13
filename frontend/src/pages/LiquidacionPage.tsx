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
        // Preferir sorteo liquidado o cerrado
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
      // Si aún no está liquidado, no es un error fatal
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

    if (!confirm(`¿Estás 100% seguro de declarar el número oficial ${numeroGanadorInput}? Esta acción premiará los boletos, deducirá comisiones y ajustará los saldos de los vendedores.`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post<LiquidacionSorteo>(`/sorteos/${sorteoSeleccionado}/liquidar`, {
        numeroGanador: numeroGanadorInput
      });

      setLiquidacionData(res.data);
      setMensajeExito(`¡Sorteo liquidado con éxito! Número Ganador Oficial: ${numeroGanadorInput}`);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-500" />
            Cierre Oficial de Sorteos y Liquidación Financiera
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Ingreso del número ganador oficial (00-99), cálculo de premios, rentabilidad empresarial y comisiones de vendedores (CU05).
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          {sorteoActual && sorteoActual.estado !== 'LIQUIDADO' && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-surface-950 rounded-lg text-sm font-bold shadow-lg shadow-yellow-500/20 transition-all"
            >
              <Award className="w-4 h-4" />
              Ingresar Ganador y Liquidar
            </button>
          )}

          <button
            onClick={() => sorteoSeleccionado && cargarLiquidacion(sorteoSeleccionado)}
            className="flex items-center gap-2 px-3 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded-lg border border-surface-700 transition-colors text-sm font-medium"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-200 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {mensajeExito && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-200 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Selector de Sorteo */}
      <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-surface-300">Seleccionar Sorteo:</span>
          <select
            value={sorteoSeleccionado || ''}
            onChange={(e) => setSorteoSeleccionado(Number(e.target.value))}
            className="bg-surface-800 border border-surface-700 text-white rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
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
            <span className="text-xs text-surface-400">Estado del Sorteo:</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              sorteoActual.estado === 'LIQUIDADO'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
            }`}>
              {sorteoActual.estado}
            </span>
          </div>
        )}
      </div>

      {/* Resultados de la Liquidación */}
      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : liquidacionData ? (
        <div className="space-y-6">
          {/* Tarjeta de Ganador y Resumen Económico */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">Número Ganador Oficial</span>
              <div className="text-5xl font-mono font-extrabold text-yellow-400 mt-2 bg-yellow-500/10 px-5 py-2 rounded-xl border border-yellow-500/30">
                {liquidacionData.numeroGanador}
              </div>
              <span className="text-[10px] text-surface-400 mt-2">Fórmula: Monto × Coef. Congelado</span>
            </div>

            <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl">
              <div className="flex items-center justify-between text-surface-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Venta Bruta Total</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                ${liquidacionData.ventaTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-surface-400 mt-1">100% Boletos activos</p>
            </div>

            <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl">
              <div className="flex items-center justify-between text-surface-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Premios Pagados</span>
                <Award className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400">
                ${liquidacionData.premioTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-surface-400 mt-1">Total a reclamar (30 días)</p>
            </div>

            <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl">
              <div className="flex items-center justify-between text-surface-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Comisión Vendedores</span>
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                ${liquidacionData.comisionVendedoresTotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-surface-400 mt-1">Margen comercial pactado</p>
            </div>

            <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl">
              <div className="flex items-center justify-between text-surface-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Ganancia Neta Empresa</span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className={`text-2xl font-bold ${liquidacionData.gananciaNetaEmpresa >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${liquidacionData.gananciaNetaEmpresa.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-surface-400 mt-1">Rentabilidad final del sorteo</p>
            </div>
          </div>

          {/* Tabla de Desglose por Vendedor */}
          <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-surface-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-brand-500" />
                Liquidación Individual por Vendedor (Saldos y Balances en Punto)
              </h2>
              <span className="text-xs text-surface-400">
                {liquidacionData.desgloseVendedores.length} vendedores participantes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-surface-300">
                <thead className="text-xs uppercase bg-surface-950 text-surface-400 border-b border-surface-800">
                  <tr>
                    <th className="px-4 py-3">Vendedor</th>
                    <th className="px-4 py-3">Zona</th>
                    <th className="px-4 py-3 text-right">Venta Emitida</th>
                    <th className="px-4 py-3 text-right">Comisión Ganada</th>
                    <th className="px-4 py-3 text-right">Premios en Punto</th>
                    <th className="px-4 py-3 text-right">Balance Neto a Entregar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {liquidacionData.desgloseVendedores.map((v) => (
                    <tr key={v.vendedorId} className="hover:bg-surface-800/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{v.nombreVendedor}</div>
                        <div className="text-xs text-surface-400">Usuario: {v.codigoVendedor}</div>
                      </td>
                      <td className="px-4 py-3">{v.zonaNombre}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-white">
                        ${v.ventaVendedor.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-cyan-400">
                        ${v.comisionVendedor.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-red-400">
                        ${v.premiosEnPunto.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${v.balanceNeto >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        ${v.balanceNeto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {liquidacionData.desgloseVendedores.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-surface-500">
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
        <div className="p-12 text-center bg-surface-900 border border-surface-800 rounded-xl space-y-4">
          <FileText className="w-12 h-12 text-surface-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Sorteo Pendiente de Liquidación</h3>
          <p className="text-sm text-surface-400 max-w-md mx-auto">
            Este sorteo aún no ha sido cerrado oficialmente con el número ganador. Presiona el botón "Ingresar Ganador y Liquidar" para ejecutar la liquidación y generar los reportes contables.
          </p>
          {sorteoActual && sorteoActual.estado !== 'LIQUIDADO' && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-surface-950 rounded-lg text-sm font-bold shadow-lg shadow-yellow-500/20 transition-all"
            >
              <Award className="w-4 h-4" />
              Ingresar Número Ganador Ahora
            </button>
          )}
        </div>
      )}

      {/* Modal de Ingreso de Ganador Oficial */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-bold text-white">Declarar Ganador Oficial</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-surface-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLiquidarSorteo} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-surface-300 block mb-1">
                  Número Ganador Oficial (00 al 99)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  required
                  value={numeroGanadorInput}
                  onChange={(e) => setNumeroGanadorInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 77"
                  className="w-full text-center text-4xl font-mono font-bold tracking-widest bg-surface-800 border border-surface-700 text-yellow-400 rounded-lg p-3 focus:border-yellow-500 focus:outline-none"
                />
                <p className="text-xs text-surface-400 mt-1.5 text-center">
                  Introduce el número de dos dígitos emitido por el sorteo.
                </p>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg text-xs text-amber-200/90 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Operación Contable Crítica
                </span>
                <p>
                  Al confirmar, el sistema congelará los cálculos según la fórmula reglamentaria, premiará las jugadas ganadoras y descontará los balances de venta en las cuentas de los vendedores.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || numeroGanadorInput.length !== 2}
                  className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-surface-950 rounded-lg text-sm font-bold shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2"
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
