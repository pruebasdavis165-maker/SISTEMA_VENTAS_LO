import 'package:flutter/material.dart';
import '../models/ticket_model.dart';
import '../models/printer_device_model.dart';
import '../services/printer_service.dart';

class PrinterProvider with ChangeNotifier {
  final PrinterService _service = PrinterService();

  List<PrinterDeviceModel> _devices = [];
  bool _isScanning = false;
  bool _isPrinting = false;
  String? _lastError;

  List<PrinterDeviceModel> get devices => _devices;
  bool get isScanning => _isScanning;
  bool get isPrinting => _isPrinting;
  String? get lastError => _lastError;
  PrinterDeviceModel? get connectedPrinter => _service.connectedPrinter;
  bool get isConnected => _service.isConnected;

  PrinterProvider() {
    _init();
  }

  Future<void> _init() async {
    await _service.loadSavedPrinter();
    notifyListeners();
  }

  // Escanear impresoras Bluetooth
  Future<void> scanPrinters() async {
    _isScanning = true;
    _lastError = null;
    notifyListeners();

    try {
      // Simulación de escaneo de dispositivos Bluetooth
      await Future.delayed(const Duration(milliseconds: 1200));
      _devices = [
        PrinterDeviceModel(name: 'POS-58 Bluetooth', address: '66:22:33:44:55:66'),
        PrinterDeviceModel(name: 'Thermal-80 Printer', address: '88:44:11:22:33:44'),
        PrinterDeviceModel(name: 'MTP-II Portable', address: '11:22:33:AA:BB:CC'),
      ];
    } catch (e) {
      _lastError = 'Error al escanear dispositivos Bluetooth.';
    } finally {
      _isScanning = false;
      notifyListeners();
    }
  }

  // Conectar a impresora
  Future<bool> connectPrinter(PrinterDeviceModel device) async {
    try {
      await _service.savePrinter(device);
      notifyListeners();
      return true;
    } catch (e) {
      _lastError = 'No se pudo conectar a la impresora seleccionada.';
      notifyListeners();
      return false;
    }
  }

  // Desconectar
  Future<void> disconnectPrinter() async {
    await _service.disconnect();
    notifyListeners();
  }

  // Imprimir Boleto
  Future<bool> printTicket(TicketModel ticket, {bool esReimpresion = false}) async {
    _isPrinting = true;
    _lastError = null;
    notifyListeners();

    try {
      final success = await _service.printTicket(ticket, esReimpresion: esReimpresion);
      _isPrinting = false;
      notifyListeners();
      return success;
    } catch (e) {
      _isPrinting = false;
      _lastError = 'No se pudo imprimir. Verifica que la impresora esté encendida.';
      notifyListeners();
      return false;
    }
  }
}
