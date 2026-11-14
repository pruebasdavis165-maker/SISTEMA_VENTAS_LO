# Sistema Ventas LO - Aplicación Móvil (Flutter / Dart)

Aplicación móvil de punto de venta y emisión de boletos para vendedores, desarrollada en **Flutter con Dart** para soporte nativo en **Android** e **iOS**.

---

## 1. Requisitos Previos

- **Flutter SDK:** >= 3.10.0 ([Instalación oficial](https://docs.flutter.dev/get-started/install))
- **Dart SDK:** >= 3.0.0
- **Android Studio** (con SDK de Android 21 a 34 y emulador o dispositivo físico)
- **Xcode** (para compilación en iOS / macOS)

---

## 2. Configuración y Conexión con el Backend

El archivo de configuración de endpoints se encuentra en:
`lib/core/constants/api_constants.dart`

Por defecto:
- **Android Emulator:** Conecta a `http://10.0.2.2:5000/api` (apunta automáticamente al host de desarrollo).
- **iOS Simulator:** Conecta a `http://localhost:5000/api`.
- **Dispositivo Físico:** Cambia `baseUrl` por la dirección IP local de tu máquina en la red local (ejemplo: `http://192.168.1.50:5000/api`).

---

## 3. Instalación de Dependencias y Ejecución

Desde la carpeta `mobile/`:

```bash
# Descargar paquetes y dependencias
flutter pub get

# Ejecutar en modo desarrollo en Android
flutter run -d android

# Ejecutar en modo desarrollo en iOS
flutter run -d ios
```

---

## 4. Funcionalidades Incluidas

1. **Autenticación y Seguridad:**
   - Inicio de sesión con usuario o cédula de identidad nicaragüense.
   - Almacenamiento seguro del token JWT mediante `flutter_secure_storage` (Android Keystore / iOS Keychain).
   - Inyección automática del encabezado `Authorization: Bearer <token>` en todas las peticiones con Dio.

2. **Punto de Venta Rápido (POS):**
   - Teclado numérico optimizado para uso con una sola mano (dígitos `00` al `99`).
   - Botones de monto rápido: C$10, C$20, C$50, C$100, C$200.
   - Cálculo en tiempo real del premio potencial según el multiplicador de la sucursal del vendedor.
   - Carrito acumulativo de jugadas antes de emitir.

3. **Impresión Térmica Bluetooth y Antifraude:**
   - Soporte para impresoras térmicas portátiles de 58mm y 80mm vía Bluetooth.
   - Generación de comandos ESC/POS estándar (encabezado, tabla de jugadas, código hash SHA-256 de seguridad y corte de papel).
   - **Lógica Invisible:** Si la impresora está apagada o sin batería, la venta se registra en la base de datos sin trabar al vendedor.
   - Marca de agua antifraude: Impresión original (`* BOLETO ORIGINAL *`) y reimpresiones controladas con contador progresivo (`*** COPIA 1 ***`, `*** COPIA 2 ***`).

4. **Historial y Regla de 5 Minutos:**
   - Vista de boletos del turno actual.
   - Temporizador de anulación con cuenta regresiva en segundos (bloqueo automático pasados los 5 minutos).
