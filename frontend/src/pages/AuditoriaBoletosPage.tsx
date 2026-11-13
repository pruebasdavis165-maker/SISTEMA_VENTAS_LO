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
      
      // Actualizar vista local
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
        return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3" /> GANADOR</span>;
      case 'NO_PREMIADO':
        return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-surface-800 text-surface-400 border border-surface-700">NO PREMIADO</span>;
      case 'ANULADO':
        return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30"><XCircle className="w-3 h-3" /> ANULADO</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"><AlertCircle className="w-3 h-3" /> ACTIVO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSearch className="w-7 h-7 text-brand-500" />
            Auditoría de Boletos, Jugadas y Reimpresión Térmica
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Búsqueda exhaustiva de tickets, inspección de apuestas, marcas de agua para copias reglamentarias y prevención de fraudes (CU06, CU09).
          </p>
        </div>

        <button
          onClick={ejecutarBusqueda}
          className="flex items-center gap-2 px-3 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded-lg border border-surface-700 transition-colors text-sm font-medium"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar Lista
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-200 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {mensajeExito && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-200 rounded-xl text-sm flex items-center justify-between">
          <span>{mensajeExito}</span>
          <button onClick={() => setMensajeExito(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="p-4 bg-surface-900 border border-surface-800 rounded-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-surface-400 block mb-1">Número de Boleto o Hash</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej. BOL-202611-0001"
                value={filtroBoleto}
                onChange={(e) => setFiltroBoleto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ejecutarBusqueda()}
                className="w-full bg-surface-800 border border-surface-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-surface-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-surface-400 block mb-1">Sorteo</label>
            <select
              value={filtroSorteo}
              onChange={(e) => setFiltroSorteo(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-surface-800 border border-surface-700 text-white rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Todos los Sorteos</option>
              {sorteos.map((s) => (
                <option key={s.id} value={s.id}>{s.codigo} ({s.fecha})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-surface-400 block mb-1">Zona Comercial</label>
            <select
              value={filtroZona}
              onChange={(e) => setFiltroZona(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-surface-800 border border-surface-700 text-white rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Todas las Zonas</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-surface-400 block mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full bg-surface-800 border border-surface-700 text-white rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
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
            className="px-3 py-1.5 text-xs text-surface-400 hover:text-white transition-colors"
          >
            Limpiar Filtros
          </button>
          <button
            onClick={ejecutarBusqueda}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Search className="w-4 h-4" />
            Buscar Boletos
          </button>
        </div>
      </div>

      {/* Tabla de Boletos Auditados */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-surface-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            Boletos Registrados en Plataforma
          </h2>
          <span className="text-xs text-surface-400">Total listados: {boletos.length}</span>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-surface-300">
              <thead className="text-xs uppercase bg-surface-950 text-surface-400 border-b border-surface-800">
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
              <tbody className="divide-y divide-surface-800">
                {boletos.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-800/50">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-brand-400">{b.numeroBoleto}</div>
                      <div className="text-[10px] text-surface-500 font-mono">Val: {b.codigoValidacion.substring(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{b.codigoSorteo}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{b.nombreVendedor}</div>
                      <div className="text-xs text-surface-400">{b.nombreZona}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      ${b.totalApostado.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">{getEstadoBadge(b.estado)}</td>
                    <td className="px-4 py-3 text-center font-mono">
                      {b.copiasImpresas > 0 ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {b.copiasImpresas} {b.copiasImpresas === 1 ? 'copia' : 'copias'}
                        </span>
                      ) : (
                        <span className="text-xs text-surface-500">Original</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-400">
                      {new Date(b.fechaEmision).toLocaleString('es-NI')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setBoletoDetalle(b)}
                        className="p-1.5 text-surface-400 hover:text-brand-400 hover:bg-surface-800 rounded-lg transition-colors"
                        title="Ver Recibo y Reimprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {boletos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-surface-500">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-700 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-800 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">Visualizador de Boleto</h3>
              </div>
              <button
                onClick={() => setBoletoDetalle(null)}
                className="text-surface-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulación del Ticket Térmico Reglamentario */}
            <div className="bg-amber-50 text-neutral-900 font-mono p-4 rounded-lg shadow-inner text-xs space-y-2 border border-neutral-300 relative overflow-hidden">
              {/* Marca de Agua si es reimpresión */}
              {boletoDetalle.copiasImpresas > 0 && (
                <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none select-none">
                  <span className="text-4xl font-extrabold uppercase transform -rotate-45 text-red-700 border-4 border-red-700 px-4 py-2">
                    COPIA {boletoDetalle.copiasImpresas}
                  </span>
                </div>
              )}

              <div className="text-center border-b border-dashed border-neutral-400 pb-2">
                <div className="font-extrabold text-sm tracking-wider">SISTEMA VENTAS LO</div>
                <div className="text-[10px] text-neutral-600">Lotería Electrónica Autorizada</div>
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

              <div className="flex justify-between font-extrabold text-sm pt-1">
                <span>TOTAL APOSTADO:</span>
                <span>${boletoDetalle.totalApostado.toFixed(2)}</span>
              </div>

              <div className="text-center pt-2 border-t border-dashed border-neutral-400 text-[9px] text-neutral-600">
                Código de Auditoría Único:<br />
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
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
