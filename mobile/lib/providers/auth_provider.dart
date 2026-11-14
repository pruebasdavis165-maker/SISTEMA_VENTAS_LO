import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../models/user_model.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../core/storage/secure_storage_service.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;

  final ApiClient _api = ApiClient();

  // Inicializar y verificar si hay sesión guardada
  Future<void> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await SecureStorageService.getAuthToken();
      if (token != null && token.isNotEmpty) {
        // Consultar perfil
        final response = await _api.dio.get(ApiConstants.profile);
        if (response.statusCode == 200) {
          _user = UserModel.fromJson(response.data);
        }
      }
    } catch (_) {
      await SecureStorageService.clearSession();
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Iniciar Sesión
  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.dio.post(
        ApiConstants.login,
        data: {
          'username': username.trim(),
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['token'] ?? data['accessToken'];

        await SecureStorageService.saveUserSession(
          token: token,
          userId: data['user']?['id']?.toString() ?? '',
          userName: data['user']?['username'] ?? username,
          role: data['user']?['rol'] ?? 'VENDEDOR',
        );

        if (data['user'] != null) {
          _user = UserModel.fromJson(data['user']);
        } else {
          await checkAuthStatus();
        }

        _isLoading = false;
        notifyListeners();
        return true;
      }

      _errorMessage = 'Credenciales incorrectas.';
      _isLoading = false;
      notifyListeners();
      return false;
    } on DioException catch (e) {
      _isLoading = false;
      if (e.response != null && e.response?.data != null) {
        final detail = e.response?.data['detail'] ?? e.response?.data['message'];
        _errorMessage = detail ?? 'Error al autenticar.';
      } else {
        _errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      }
      notifyListeners();
      return false;
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Ocurrió un error inesperado.';
      notifyListeners();
      return false;
    }
  }

  // Cerrar Sesión
  Future<void> logout() async {
    await SecureStorageService.clearSession();
    _user = null;
    notifyListeners();
  }
}
