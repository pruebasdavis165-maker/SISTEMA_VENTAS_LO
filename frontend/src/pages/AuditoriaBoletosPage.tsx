import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BoletoAuditoria, ReimprimirBoletoResponse } from '../types/boletos';
import { Sorteo } from '../types/sorteos';
import { Zona } from '../types/zonas';
import { 
  FileSearch, 
  Printer, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  X,
  Ticket
} from 'lucide-react';

export const AuditoriaBoletosPage: React.FC = () => {
  const [boletos, setBoletos] = useState<BoletoAuditoria[]>([]);
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Filtros
  const [filtroBoleto, setFiltroBoleto] = useState('');
  const [filtroSorteo, setFiltroSorteo] = useState<number | ''>('');
  const [filtroZona, setFiltroZona] = useState<number | ''>('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Boleto seleccionado para vista de recibo / reimpresión
  const [boletoDetalle, setBoletoDetalle] = useState<BoletoAuditoria | null>(null);
  const [reimprimiendo, setReimprimiendo] = useState(false);

  useEffect(() => {
    cargarFiltrosIniciales();
    ejecutarBusqueda();
  }, []);

  const cargarFiltrosIniciales = async () => {
    try {
      const [resSorteos, resZonas] = await Promise.all([
        api.get<Sorteo[]>('/sorteos'),
        api.get<Zona[]>('/zonas')
      ]);
      setSorteos(resSorteos.data);
      setZonas(resZonas.data);
    } catch {
      // Ignorar fallo de carga de filtros secundarios
    }
  };

  const ejecutarBusqueda = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (filtroBoleto.trim()) params.numeroBoleto = filtroBoleto.trim();
      if (filtroSorteo) params.sorteoId = filtroSorteo;
      if (filtroZona) params.zonaId = filtroZona;
      if (filtroEstado) params.estado = filtroEstado;

      const res = await api.get<BoletoAuditoria[]>('/boletos/auditoria', { params });
      setBoletos(res.data);
    } catch {
      setError('Error al consultar boletos en auditoría.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReimprimir = async (boletoId: number) => {
    setReimprimiendo(true);
    setError(null);
    try {
      const res = await api.post<ReimprimirBoletoResponse>(`/boletos/${boletoId}/reimprimir`);
      setMensajeExito(`Boleto reimpreso exitosamente con marca reglamentaria: "${res.data.marcaAguaCopia}"`);
      
      if (boletoDetalle && boletoDetalle.id === boletoId) {
        setBoletoDetalle({
          ...boletoDetalle,
          copiasImpresas: res.data.totalCopias
        });
      }

      await ejecutarBusqueda();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo reimprimir el boleto.');
    } finally {
      setReimprimiendo(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PREMIADO':
        return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"><CheckCircle2 className="w-3 h-3" /> GANADOR</span>;
      case 'NO_PREMIADO':
        return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">NO PREMIADO</span>;
      case 'ANULADO':
        return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30"><XCircle className="w-3 h-3" /> ANULADO</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30"><AlertCircle className="w-3 h-3" /> ACTIVO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Auditoría de Boletos, Jugadas y Reimpresión Térmica
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
            Búsqueda exhaustiva de tickets, inspección de apuestas, marcas de agua para copias reglamentarias y prevención de fraudes.
          </p>
        </div>

        <button
          onClick={ejecutarBusqueda}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors text-xs font-semibold shrink-0"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar Lista
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {mensajeExito && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{mensajeExito}</span>
          <button onClick={() => setMensajeExito(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros con selects estilizados */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
              Número de Boleto
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej. BOL-202611-0001"
                value={filtroBoleto}
                onChange={(e) => setFiltroBoleto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ejecutarBusqueda()}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
              Sorteo
            </label>
            <select
              value={filtroSorteo}
              onChange={(e) => setFiltroSorteo(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos los Sorteos</option>
              {sorteos.map((s) => (
                <option key={s.id} value={s.id}>{s.codigo} ({s.fecha})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
              Zona Comercial
            </label>
            <select
              value={filtroZona}
              onChange={(e) => setFiltroZona(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todas las Zonas</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos los Estados</option>
              <option value="ACTIVO">ACTIVO</option>
              <option value="PREMIADO">PREMIADO (GANADOR)</option>
              <option value="NO_PREMIADO">NO PREMIADO</option>
              <option value="ANULADO">ANULADO</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => {
              setFiltroBoleto('');
              setFiltroSorteo('');
              setFiltroZona('');
              setFiltroEstado('');
            }}
            className="px-3.5 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-semibold"
          >
            Limpiar Filtros
          </button>
          <button
            onClick={ejecutarBusqueda}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            Buscar Boletos
          </button>
        </div>
      </div>

      {/* Tabla de Boletos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Número Boleto</th>
                  <th className="px-4 py-3">Sorteo</th>
                  <th className="px-4 py-3">Vendedor / Zona</th>
                  <th className="px-4 py-3 text-right">Apostado</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Copias</th>
                  <th className="px-4 py-3">Fecha Emisión</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {boletos.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{b.numeroBoleto}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Val: {b.codigoValidacion.substring(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{b.codigoSorteo}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{b.nombreVendedor}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{b.nombreZona}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${b.totalApostado.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">{getEstadoBadge(b.estado)}</td>
                    <td className="px-4 py-3 text-center font-mono">
                      {b.copiasImpresas > 0 ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30">
                          {b.copiasImpresas} {b.copiasImpresas === 1 ? 'copia' : 'copias'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Original</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(b.fechaEmision).toLocaleString('es-NI')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setBoletoDetalle(b)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Ver Recibo y Reimprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {boletos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      No se encontraron boletos que coincidan con los criterios de búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Visor de Ticket Térmico y Reimpresión */}
      {boletoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Visualizador de Boleto</h3>
              </div>
              <button
                onClick={() => setBoletoDetalle(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulación del Ticket Térmico */}
            <div className="bg-amber-50 text-neutral-900 font-mono p-4 rounded-xl shadow-inner text-xs space-y-2 border border-neutral-300 relative overflow-hidden">
              {boletoDetalle.copiasImpresas > 0 && (
                <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none select-none">
                  <span className="text-4xl font-black uppercase transform -rotate-45 text-red-700 border-4 border-red-700 px-4 py-2">
                    COPIA {boletoDetalle.copiasImpresas}
                  </span>
                </div>
              )}

              <div className="text-center border-b border-dashed border-neutral-400 pb-2">
                <div className="font-black text-sm tracking-wider">SISTEMA VENTAS LO</div>
                <div className="text-[10px] text-neutral-600">Comprobante de Apuesta</div>
                <div className="text-[10px] text-neutral-600 mt-1">Zona: {boletoDetalle.nombreZona}</div>
                <div className="text-[10px] text-neutral-600">Vendedor: {boletoDetalle.nombreVendedor}</div>
              </div>

              <div className="flex justify-between text-[11px] pt-1">
                <span>Ticket:</span>
                <span className="font-bold">{boletoDetalle.numeroBoleto}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Sorteo:</span>
                <span className="font-bold">{boletoDetalle.codigoSorteo}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Emisión:</span>
                <span>{new Date(boletoDetalle.fechaEmision).toLocaleString('es-NI')}</span>
              </div>

              {/* Detalle de Jugadas */}
              <div className="border-t border-b border-dashed border-neutral-400 py-2 my-2 space-y-1">
                <div className="flex justify-between font-bold text-[10px] text-neutral-700 uppercase">
                  <span>Núm</span>
                  <span>Monto</span>
                  <span>Premio Potencial</span>
                </div>
                {boletoDetalle.jugadas.map((j) => (
                  <div key={j.id} className="flex justify-between text-[11px]">
                    <span className="font-bold text-neutral-900">[{j.numero}]</span>
                    <span>${j.monto.toFixed(2)}</span>
                    <span className="font-semibold">${j.premioCalculado.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-black text-sm pt-1">
                <span>TOTAL APOSTADO:</span>
                <span>${boletoDetalle.totalApostado.toFixed(2)}</span>
              </div>

              <div className="text-center pt-2 border-t border-dashed border-neutral-400 text-[9px] text-neutral-600">
                Código de Validación Único:<br />
                <span className="font-mono text-neutral-800 break-all">{boletoDetalle.codigoValidacion}</span>
              </div>

              {boletoDetalle.copiasImpresas > 0 && (
                <div className="text-center font-bold text-red-700 text-[10px] pt-1 uppercase">
                  *** REIMPRESIÓN OFICIAL - COPIA {boletoDetalle.copiasImpresas} ***
                </div>
              )}
            </div>

            {/* Botón de Reimpresión */}
            <button
              onClick={() => handleReimprimir(boletoDetalle.id)}
              disabled={reimprimiendo || boletoDetalle.estado === 'ANULADO'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              {reimprimiendo ? 'Imprimiendo copia...' : 'Generar Reimpresión Térmica'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
