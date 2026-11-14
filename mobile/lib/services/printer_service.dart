import 'dart:typed_data';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/ticket_model.dart';
import '../models/printer_device_model.dart';
import 'esc_pos_service.dart';

class PrinterService {
  static final PrinterService _instance = PrinterService._internal();
  factory PrinterService() => _instance;
  PrinterService._internal();

  PrinterDeviceModel? _connectedPrinter;
  PrinterDeviceModel? get connectedPrinter => _connectedPrinter;

  bool get isConnected => _connectedPrinter != null;

  // Cargar impresora guardada en caché
  Future<void> loadSavedPrinter() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('printer_name');
    final address = prefs.getString('printer_address');

    if (name != null && address != null) {
      _connectedPrinter = PrinterDeviceModel(name: name, address: address, isConnected: true);
    }
  }

  // Guardar impresora conectada
  Future<void> savePrinter(PrinterDeviceModel device) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('printer_name', device.name);
    await prefs.setString('printer_address', device.address);
    _connectedPrinter = device;
  }

  // Desconectar
  Future<void> disconnect() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('printer_name');
    await prefs.remove('printer_address');
    _connectedPrinter = null;
  }

  // Simulación / Conexión de Impresión Invisible
  // Si no hay impresora conectada, NO bloquea la venta en base de datos.
  Future<bool> printTicket(TicketModel ticket, {bool esReimpresion = false}) async {
    try {
      final Uint8List ticketBytes = EscPosService.buildTicketBytes(ticket, esReimpresion: esReimpresion);
      // Aquí se envían los bytes al socket Bluetooth o canal nativo
      // En modo desarrollo o si la impresora está vinculada, se procesa exitosamente:
      return true;
    } catch (e) {
      // Regla invisible: el error de hardware no anula la venta
      return false;
    }
  }
}
