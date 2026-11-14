import 'dart:convert';
import 'dart:typed_data';
import 'package:intl/intl.dart';
import '../models/ticket_model.dart';

class EscPosService {
  // Comandos estándar ESC/POS
  static const int esc = 0x1B;
  static const int gs = 0x1D;

  static Uint8List buildTicketBytes(TicketModel ticket, {bool esReimpresion = false}) {
    final List<int> bytes = [];

    void write(List<int> cmd) => bytes.addAll(cmd);
    void text(String str) => bytes.addAll(latin1.encode(str));
    void line(String str) {
      bytes.addAll(latin1.encode(str));
      bytes.addAll([0x0A]);
    }

    // 1. Inicializar Impresora
    write([esc, 0x40]); // ESC @

    // 2. Encabezado Centrado
    write([esc, 0x61, 0x01]); // Align Center
    write([esc, 0x45, 0x01]); // Bold ON
    write([gs, 0x21, 0x11]); // Doble altura y doble ancho
    line('VENTAS LO');
    write([gs, 0x21, 0x00]); // Normal
    line('PLATAFORMA OFICIAL');
    write([esc, 0x45, 0x00]); // Bold OFF

    line('--------------------------------');

    // 3. Marca de agua Antifraude
    if (esReimpresion || ticket.cantidadReimpresiones > 0) {
      write([esc, 0x45, 0x01]);
      line('*** COPIA ${ticket.cantidadReimpresiones > 0 ? ticket.cantidadReimpresiones : 1} ***');
      line('NO VALIDO PARA COBRO DUPLICADO');
      write([esc, 0x45, 0x00]);
    } else {
      line('* BOLETO ORIGINAL *');
    }
    line('--------------------------------');

    // 4. Datos del Turno y Emisión
    write([esc, 0x61, 0x00]); // Align Left
    line('Boleto: ${ticket.numeroBoleto}');
    line('Sorteo: ${ticket.sorteoCodigo}');
    line('Sucursal: ${ticket.zonaNombre}');
    line('Vendedor: ${ticket.vendedorNombre}');
    final fechaStr = DateFormat('dd/MM/yyyy hh:mm a').format(ticket.fechaEmision);
    line('Fecha:  $fechaStr');
    line('--------------------------------');

    // 5. Tabla de Jugadas
    write([esc, 0x45, 0x01]); // Bold ON
    line('NUM     MONTO           PREMIO');
    write([esc, 0x45, 0x00]); // Bold OFF
    line('--------------------------------');

    for (final j in ticket.jugadas) {
      final numStr = j.numero.padRight(6);
      final montoStr = 'C\$${j.monto.toStringAsFixed(0)}'.padRight(12);
      final premioStr = 'C\$${j.premioPotencial.toStringAsFixed(0)}'.padLeft(14);
      line('$numStr$montoStr$premioStr');
    }

    line('--------------------------------');

    // 6. Total
    write([esc, 0x61, 0x02]); // Align Right
    write([esc, 0x45, 0x01]);
    write([gs, 0x21, 0x01]); // Doble altura
    line('TOTAL: C\$ ${ticket.totalVenta.toStringAsFixed(2)}');
    write([gs, 0x21, 0x00]); // Normal
    write([esc, 0x45, 0x00]); // Bold OFF

    // 7. Pie y Código de Seguridad
    write([esc, 0x61, 0x01]); // Align Center
    line('--------------------------------');
    line('Codigo de Verificacion:');
    final hashCorto = ticket.hashSeguridad.isNotEmpty 
        ? ticket.hashSeguridad.substring(0, ticket.hashSeguridad.length.clamp(0, 16)).toUpperCase() 
        : 'AUTENTICADO';
    write([esc, 0x45, 0x01]);
    line(hashCorto);
    write([esc, 0x45, 0x00]);
    line('');
    line('Verifique su boleto al recibirlo.');
    line('Caduca a los 7 dias calendario.');
    line('¡Buena Suerte!');
    line('');

    // Feed de papel y corte
    write([0x0A, 0x0A, 0x0A, 0x0A]);
    write([gs, 0x56, 0x41, 0x03]); // GS V A (Cut)

    return Uint8List.fromList(bytes);
  }
}
