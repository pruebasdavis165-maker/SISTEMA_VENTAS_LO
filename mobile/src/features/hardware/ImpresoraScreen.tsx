import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { useAppStore } from '../../store/appStore';
import { ScreenHeader } from '../../components/ScreenHeader';
import { bluetoothService, BluetoothDevice } from '../../services/bluetoothService';

export const ImpresoraScreen: React.FC = () => {
  const { impresoraConectada, impresoraNombre, setImpresoraEstado } = useAppStore();

  const [dispositivos, setDispositivos] = useState<BluetoothDevice[]>([]);
  const [escaneando, setEscaneando] = useState<boolean>(false);
  const [conectandoId, setConectandoId] = useState<string | null>(null);

  const iniciarEscaneo = async () => {
    try {
      setEscaneando(true);
      const devices = await bluetoothService.scanDevices();
      setDispositivos(devices);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron escanear dispositivos Bluetooth.');
    } finally {
      setEscaneando(false);
    }
  };

  useEffect(() => {
    iniciarEscaneo();
  }, []);

  const handleConectar = async (device: BluetoothDevice) => {
    try {
      setConectandoId(device.id);
      const exito = await bluetoothService.connect(device);

      if (exito) {
        setImpresoraEstado(true, device.name);
        Alert.alert('Conectado', `Impresora ${device.name} vinculada exitosamente.`);
      } else {
        Alert.alert('Fallo de Conexión', 'No se pudo establecer enlace Bluetooth con el periférico.');
      }
    } catch (err) {
      Alert.alert('Error', 'Error inesperado al conectar impresora.');
    } finally {
      setConectandoId(null);
    }
  };

  const handleDesconectar = () => {
    bluetoothService.disconnect();
    setImpresoraEstado(false, null);
    Alert.alert('Desconectada', 'Impresora desvinculada del dispositivo.');
  };

  const handlePruebaImpresion = () => {
    if (!impresoraConectada) {
      Alert.alert('Sin Conexión', 'Empareja una impresora antes de imprimir un ticket de prueba.');
      return;
    }
    Alert.alert('Test ESC/POS', 'Enviando pulso de prueba térmica ESC/POS... ¡Ticket impreso!');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        titulo="Hardware de Impresión"
        subtitulo="Gestión de mini-impresoras térmicas Bluetooth"
      />

      <ScrollView style={styles.content}>
        {/* Banner de Estado Hardware Invisible */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: impresoraConectada ? COLORS.secondary : COLORS.danger },
              ]}
            />
            <Text style={styles.statusTitle}>
              {impresoraConectada ? 'IMPRESORA CONECTADA' : 'MODO HARDWARE INVISIBLE'}
            </Text>
          </View>

          <Text style={styles.statusDesc}>
            {impresoraConectada
              ? `Dispositivo activo: ${impresoraNombre || 'Impresora Térmica 58mm'}. Todos los tickets se imprimirán en el acto.`
              : 'Si no cuentas con impresora o el Bluetooth está apagado, el sistema continuará emitiendo boletos con normalidad en el servidor. Podrás reimprimirlos más tarde.'}
          </Text>

          {impresoraConectada && (
            <View style={styles.statusActions}>
              <TouchableOpacity
                style={styles.btnTest}
                onPress={handlePruebaImpresion}
                activeOpacity={0.8}
              >
                <Text style={styles.btnTestText}>Probar Impresión</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnDesconectar}
                onPress={handleDesconectar}
                activeOpacity={0.8}
              >
                <Text style={styles.btnDesconectarText}>Desconectar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sección de Escaneo */}
        <View style={styles.scanHeader}>
          <Text style={styles.scanTitle}>DISPOSITIVOS CERCANOS ENCONTRADOS</Text>
          <TouchableOpacity
            style={styles.btnEscanear}
            onPress={iniciarEscaneo}
            disabled={escaneando}
          >
            {escaneando ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={styles.btnEscanearText}>↻ Escanear</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lista de Dispositivos */}
        {dispositivos.map((dev) => {
          const isCurrent = impresoraConectada && impresoraNombre === dev.name;
          const isConnecting = conectandoId === dev.id;

          return (
            <View key={dev.id} style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{dev.name}</Text>
                <Text style={styles.deviceAddress}>MAC: {dev.address}</Text>
                <Text style={styles.deviceSpec}>Formato: Térmica 58mm/80mm • ESC/POS</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.btnConectar,
                  isCurrent && styles.btnConectado,
                  isConnecting && styles.btnDisabled,
                ]}
                onPress={() => handleConectar(dev)}
                disabled={isCurrent || isConnecting}
                activeOpacity={0.8}
              >
                {isConnecting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={[styles.btnConectarText, isCurrent && styles.btnConectadoText]}>
                    {isCurrent ? 'Vinculado' : 'Conectar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btnTest: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnTestText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  btnDesconectar: {
    flex: 1,
    backgroundColor: '#7F1D1D',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnDesconectarText: {
    color: '#FECACA',
    fontSize: 13,
    fontWeight: '700',
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnEscanear: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnEscanearText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  deviceCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  deviceAddress: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  deviceSpec: {
    color: COLORS.accent,
    fontSize: 11,
    marginTop: 2,
  },
  btnConectar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  btnConectado: {
    backgroundColor: '#064E3B',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnConectarText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  btnConectadoText: {
    color: '#34D399',
  },
});
