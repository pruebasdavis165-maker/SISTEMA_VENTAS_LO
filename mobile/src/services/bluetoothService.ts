import { PermissionsAndroid, Platform } from 'react-native';

export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  connected: boolean;
}

class BluetoothThermalService {
  private connectedDevice: BluetoothDevice | null = null;
  private isScanning: boolean = false;

  // 1. Solicitud de Permisos conforme a políticas de Android 12+ (API 31+) y versiones anteriores
  public async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Error solicitando permisos de Bluetooth:', err);
      return false;
    }
  }

  // 2. Escaneo de Dispositivos Térmicos (Dispositivos Bluetooth SPP / POS 58mm / 80mm)
  public async scanDevices(): Promise<BluetoothDevice[]> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Permisos de Bluetooth no concedidos');
    }

    this.isScanning = true;
    // Emulación y descubrimiento de impresoras térmicas POS compatibles
    await new Promise((resolve) => setTimeout(resolve, 1200));
    this.isScanning = false;

    return [
      {
        id: 'BT-PRINTER-5801',
        name: 'POS-5802 Thermal Printer',
        address: '66:22:33:44:55:66',
        connected: this.connectedDevice?.address === '66:22:33:44:55:66',
      },
      {
        id: 'BT-PRINTER-PT210',
        name: 'PT-210 Mobile Printer',
        address: '88:44:11:99:AA:BB',
        connected: this.connectedDevice?.address === '88:44:11:99:AA:BB',
      },
      {
        id: 'BT-PRINTER-MTP2',
        name: 'MTP-II Mini 58mm',
        address: '00:11:22:33:FF:EE',
        connected: this.connectedDevice?.address === '00:11:22:33:FF:EE',
      },
    ];
  }

  // 3. Conexión y emparejamiento con la impresora térmica
  public async connect(device: BluetoothDevice): Promise<boolean> {
    try {
      // Simula protocolo SPP / handshake con la impresora
      await new Promise((resolve) => setTimeout(resolve, 800));
      this.connectedDevice = { ...device, connected: true };
      return true;
    } catch (err) {
      console.error('Fallo de conexión Bluetooth:', err);
      return false;
    }
  }

  public disconnect(): void {
    this.connectedDevice = null;
  }

  public getConnectedDevice(): BluetoothDevice | null {
    return this.connectedDevice;
  }

  public isConnected(): boolean {
    return this.connectedDevice !== null;
  }
}

export const bluetoothService = new BluetoothThermalService();
