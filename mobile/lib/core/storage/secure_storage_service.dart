import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const String _keyToken = 'jwt_auth_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUserId = 'user_id';
  static const String _keyUserName = 'user_name';
  static const String _keyUserRole = 'user_role';

  // Guardar Token
  static Future<void> saveAuthToken(String token) async {
    await _storage.write(key: _keyToken, value: token);
  }

  // Obtener Token
  static Future<String?> getAuthToken() async {
    return await _storage.read(key: _keyToken);
  }

  // Guardar Datos de Sesión
  static Future<void> saveUserSession({
    required String token,
    required String userId,
    required String userName,
    required String role,
  }) async {
    await _storage.write(key: _keyToken, value: token);
    await _storage.write(key: _keyUserId, value: userId);
    await _storage.write(key: _keyUserName, value: userName);
    await _storage.write(key: _keyUserRole, value: role);
  }

  // Obtener Datos de Sesión
  static Future<Map<String, String?>> getUserSession() async {
    return {
      'token': await _storage.read(key: _keyToken),
      'userId': await _storage.read(key: _keyUserId),
      'userName': await _storage.read(key: _keyUserName),
      'role': await _storage.read(key: _keyUserRole),
    };
  }

  // Borrar Sesión (Logout)
  static Future<void> clearSession() async {
    await _storage.deleteAll();
  }
}
