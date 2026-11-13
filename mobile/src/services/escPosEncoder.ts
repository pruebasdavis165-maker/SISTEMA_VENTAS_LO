export interface TicketData {
  numeroBoleto: string;
  codigoValidacion: string;
  sorteoCodigo: string;
  fechaEmision: string;
  nombreZona?: string;
  nombreVendedor?: string;
  copiasImpresas?: number;
  marcaAguaCopia?: string | null; // null si es original, o "COPIA 1", "COPIA 2"
  totalApostado: number;
  totalPremioEstimado: number;
  jugadas: Array<{
    numero: string;
    monto: number;
    premioCalculado: number;
  }>;
}

export class EscPosEncoder {
  // Comandos de inicialización y formato estándar ESC/POS
  private static readonly ESC = '\x1B';
  private static readonly GS = '\x1D';

  public static readonly INIT = `${EscPosEncoder.ESC}@`;
  public static readonly ALIGN_LEFT = `${EscPosEncoder.ESC}a\x00`;
  public static readonly ALIGN_CENTER = `${EscPosEncoder.ESC}a\x01`;
  public static readonly ALIGN_RIGHT = `${EscPosEncoder.ESC}a\x02`;
  public static readonly BOLD_ON = `${EscPosEncoder.ESC}E\x01`;
  public static readonly BOLD_OFF = `${EscPosEncoder.ESC}E\x00`;
  public static readonly DOUBLE_HEIGHT_ON = `${EscPosEncoder.ESC}!\x10`;
  public static readonly DOUBLE_WIDTH_ON = `${EscPosEncoder.ESC}!\x20`;
  public static readonly DOUBLE_SIZE_ON = `${EscPosEncoder.ESC}!\x30`;
  public static readonly NORMAL_SIZE = `${EscPosEncoder.ESC}!\x00`;
  public static readonly FEED_3_LINES = `${EscPosEncoder.ESC}d\x03`;
  public static readonly CUT_PAPER = `${EscPosEncoder.GS}V\x41\x00`;

  /**
   * Genera el payload de comandos ESC/POS formateado para 32 columnas (58mm) o 48 columnas (80mm)
   */
  public static generarTicket(data: TicketData, anchoColumnas: number = 32): string {
    let out = '';
    const separador = '-'.repeat(anchoColumnas);
    const separadorDoble = '='.repeat(anchoColumnas);

    out += EscPosEncoder.INIT;

    // Sello de Marca de Agua Antifraude si es reimpresión
    if (data.marcaAguaCopia) {
      out += EscPosEncoder.ALIGN_CENTER;
      out += EscPosEncoder.BOLD_ON;
      out += `*** ${data.marcaAguaCopia.toUpperCase()} ***\n`;
      out += `REIMPRESION NO VALIDA PARA COBRO\n`;
      out += EscPosEncoder.BOLD_OFF;
      out += `${separador}\n`;
    }

    // Encabezado
    out += EscPosEncoder.ALIGN_CENTER;
    out += EscPosEncoder.BOLD_ON;
    out += `SISTEMA VENTAS LO\n`;
    out += EscPosEncoder.BOLD_OFF;
    out += `Terminal de Venta Oficial\n`;
    out += `Zona: ${data.nombreZona || 'General'}\n`;
    if (data.nombreVendedor) {
      out += `Agente: ${data.nombreVendedor}\n`;
    }
    out += `${separador}\n`;

    // Datos del Sorteo y Boleto
    out += EscPosEncoder.ALIGN_LEFT;
    out += `Boleto: ${data.numeroBoleto}\n`;
    out += `Sorteo: ${data.sorteoCodigo}\n`;
    out += `Fecha : ${new Date(data.fechaEmision).toLocaleString()}\n`;
    out += `Hash  : ${data.codigoValidacion}\n`;
    out += `${separador}\n`;

    // Tabla de Jugadas
    out += EscPosEncoder.BOLD_ON;
    out += EscPosEncoder.padRow('NUMERO', 'MONTO', 'PREMIO', anchoColumnas) + '\n';
    out += EscPosEncoder.BOLD_OFF;
    out += `${separador}\n`;

    for (const j of data.jugadas) {
      out +=
        EscPosEncoder.padRow(
          `[ ${j.numero.padStart(2, '0')} ]`,
          `$${j.monto.toFixed(2)}`,
          `$${j.premioCalculado.toFixed(2)}`,
          anchoColumnas
        ) + '\n';
    }

    out += `${separadorDoble}\n`;

    // Totales
    out += EscPosEncoder.ALIGN_RIGHT;
    out += EscPosEncoder.BOLD_ON;
    out += `TOTAL APOSTADO : $${data.totalApostado.toFixed(2)}\n`;
    out += `PREMIO MAXIMO  : $${data.totalPremioEstimado.toFixed(2)}\n`;
    out += EscPosEncoder.BOLD_OFF;
    out += `${separador}\n`;

    // Pie de Seguridad y Validez
    out += EscPosEncoder.ALIGN_CENTER;
    out += `Conserve este boleto termico\n`;
    out += `Validez de cobro: 30 dias calendario\n`;

    if (data.marcaAguaCopia) {
      out += EscPosEncoder.BOLD_ON;
      out += `*** AUDITORIA: ${data.marcaAguaCopia} ***\n`;
      out += EscPosEncoder.BOLD_OFF;
    }

    // Alimentación de papel y corte
    out += EscPosEncoder.FEED_3_LINES;
    out += EscPosEncoder.CUT_PAPER;

    return out;
  }

  private static padRow(col1: string, col2: string, col3: string, totalWidth: number): string {
    const w1 = 10;
    const w2 = 10;
    const w3 = totalWidth - w1 - w2;

    const p1 = col1.padEnd(w1);
    const p2 = col2.padStart(w2);
    const p3 = col3.padStart(w3);

    return `${p1}${p2}${p3}`;
  }
}
