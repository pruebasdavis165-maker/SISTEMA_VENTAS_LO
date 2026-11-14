import 'dart:io';

class ApiConstants {
  // Configuración de URL Base:
  // En Android Emulator: 10.0.2.2 apunta al localhost de la máquina host.
  // En iOS Simulator o Dispositivo Físico: Usar la IP local de red (ej. 192.168.1.X) o localhost.
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api';
    } else if (Platform.isIOS) {
      return 'http://localhost:5000/api';
    } else {
      return 'http://localhost:5000/api';
    }
  }

  // Endpoints
  static const String login = '/auth/login';
  static const String profile = '/auth/me';
  static const String sorteos = '/sorteos';
  static const String sorteoActivo = '/sorteos/activo';
  static const String boletos = '/boletos';
  static const String boletosHistorial = '/boletos/historial';
  static const String anularBoleto = '/boletos';
  static const String reimprimirBoleto = '/boletos';
}
