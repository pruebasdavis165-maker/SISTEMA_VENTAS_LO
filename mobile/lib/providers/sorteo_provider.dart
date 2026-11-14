import 'dart:async';
import 'package:flutter/material.dart';
import '../models/sorteo_model.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';

class SorteoProvider with ChangeNotifier {
  List<SorteoModel> _sorteos = [];
  SorteoModel? _sorteoSeleccionado;
  bool _isLoading = false;
  String? _errorMessage;
  Timer? _countdownTimer;

  List<SorteoModel> get sorteos => _sorteos;
  SorteoModel? get sorteoSeleccionado => _sorteoSeleccionado;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  final ApiClient _api = ApiClient();

  SorteoProvider() {
    _startCountdown();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (_sorteoSeleccionado != null && _sorteoSeleccionado!.permiteVenta) {
        notifyListeners();
      }
    });
  }

  // Cargar sorteos del día
  Future<void> fetchSorteos() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.dio.get(ApiConstants.sorteos);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        _sorteos = data.map((json) => SorteoModel.fromJson(json)).toList();

        // Seleccionar por defecto el primer sorteo abierto
        final abiertos = _sorteos.where((s) => s.permiteVenta).toList();
        if (abiertos.isNotEmpty) {
          _sorteoSeleccionado = abiertos.first;
        } else if (_sorteos.isNotEmpty) {
          _sorteoSeleccionado = _sorteos.first;
        }
      }
    } catch (e) {
      _errorMessage = 'No se pudieron sincronizar los turnos de sorteo.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void seleccionarSorteo(SorteoModel sorteo) {
    _sorteoSeleccionado = sorteo;
    notifyListeners();
  }
}
