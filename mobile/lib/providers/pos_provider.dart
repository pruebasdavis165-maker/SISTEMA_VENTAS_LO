import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../models/jugada_model.dart';
import '../models/ticket_model.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';

class PosProvider with ChangeNotifier {
  final List<JugadaModel> _carrito = [];
  String _numeroActual = '';
  double _montoActual = 10.0;
  bool _isSubmitting = false;
  String? _errorMessage;
  TicketModel? _ultimoBoletoEmitido;

  List<JugadaModel> get carrito => _carrito;
  String get numeroActual => _numeroActual;
  double get montoActual => _montoActual;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  TicketModel? get ultimoBoletoEmitido => _ultimoBoletoEmitido;

  double get totalVenta => _carrito.fold(0.0, (acc, j) => acc + j.monto);
  int get totalJugadas => _carrito.length;

  final ApiClient _api = ApiClient();

  // Teclado numérico a una mano (dígitos 0 al 9)
  void appendDigit(String digit) {
    if (_numeroActual.length >= 2) {
      _numeroActual = digit; // Reinicia si ya tiene 2 dígitos
    } else {
      _numeroActual += digit;
    }
    notifyListeners();
  }

  void backspace() {
    if (_numeroActual.isNotEmpty) {
      _numeroActual = _numeroActual.substring(0, _numeroActual.length - 1);
      notifyListeners();
    }
  }

  void clearNumero() {
    _numeroActual = '';
    notifyListeners();
  }

  void setMonto(double monto) {
    _montoActual = monto;
    notifyListeners();
  }

  // Agregar jugada al carrito con cálculo en vivo de premio
  bool agregarJugada({required double coeficiente}) {
    if (_numeroActual.isEmpty) return false;

    final numPadded = _numeroActual.padLeft(2, '0');
    final numInt = int.tryParse(numPadded);
    if (numInt == null || numInt < 0 || numInt > 99) return false;

    if (_montoActual <= 0) return false;

    // Verificar si el número ya existe en el carrito para acumular monto
    final index = _carrito.indexWhere((j) => j.numero == numPadded);
    final premio = _montoActual * coeficiente;

    if (index >= 0) {
      final existente = _carrito[index];
      final nuevoMonto = existente.monto + _montoActual;
      _carrito[index] = JugadaModel(
        numero: numPadded,
        monto: nuevoMonto,
        premioPotencial: nuevoMonto * coeficiente,
      );
    } else {
      _carrito.add(JugadaModel(
        numero: numPadded,
        monto: _montoActual,
        premioPotencial: premio,
      ));
    }

    _numeroActual = '';
    notifyListeners();
    return true;
  }

  void eliminarJugada(int index) {
    if (index >= 0 && index < _carrito.length) {
      _carrito.removeAt(index);
      notifyListeners();
    }
  }

  void limpiarCarrito() {
    _carrito.clear();
    _numeroActual = '';
    _errorMessage = null;
    notifyListeners();
  }

  // Emitir Boleto en Backend
  Future<bool> emitirBoleto({
    required int sorteoId,
    required String vendedorId,
  }) async {
    if (_carrito.isEmpty) {
      _errorMessage = 'Agrega al menos una jugada antes de emitir.';
      notifyListeners();
      return false;
    }

    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.dio.post(
        ApiConstants.boletos,
        data: {
          'sorteoId': sorteoId,
          'jugadas': _carrito.map((j) => j.toJson()).toList(),
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        _ultimoBoletoEmitido = TicketModel.fromJson(response.data);
        _carrito.clear();
        _isSubmitting = false;
        notifyListeners();
        return true;
      }

      _errorMessage = 'No se pudo emitir el boleto.';
      _isSubmitting = false;
      notifyListeners();
      return false;
    } on DioException catch (e) {
      _isSubmitting = false;
      if (e.response != null && e.response?.data != null) {
        final detail = e.response?.data['detail'] ?? e.response?.data['message'];
        _errorMessage = detail ?? 'Error al procesar la jugada.';
      } else {
        _errorMessage = 'Error de conexión al emitir boleto.';
      }
      notifyListeners();
      return false;
    } catch (e) {
      _isSubmitting = false;
      _errorMessage = 'Ocurrió un error inesperado.';
      notifyListeners();
      return false;
    }
  }
}
