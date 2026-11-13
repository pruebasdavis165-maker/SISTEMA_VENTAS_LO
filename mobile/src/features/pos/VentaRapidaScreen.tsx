import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../theme/colors';
import { useAppStore } from '../../store/appStore';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { ScreenHeader } from '../../components/ScreenHeader';
import { JugadaItem } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'VentaRapida'>;

const PRESET_MONTOS = [10, 20, 50, 100];

export const VentaRapidaScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, jugadas, agregarJugada, eliminarJugada, limpiarCarrito } = useAppStore();

  const [numeroInput, setNumeroInput] = useState<string>('');
  const [montoInput, setMontoInput] = useState<string>('10');
  const [activeTab, setActiveTab] = useState<'numero' | 'monto'>('numero');

  const coeficiente = user?.coeficientePremio || 70; // 70x por defecto según regla de negocio
  const saldoDisponible = user?.saldoCredito ?? 0;

  // Totales reactivos en memoria
  const totalApostado = useMemo(() => {
    return jugadas.reduce((acc, curr) => acc + curr.monto, 0);
  }, [jugadas]);

  const maxPremioEstimado = useMemo(() => {
    return jugadas.reduce((max, curr) => (curr.premioPotencial > max ? curr.premioPotencial : max), 0);
  }, [jugadas]);

  const montoNumerico = parseFloat(montoInput) || 0;
  const premioCalculadoEnVivo = useMemo(() => {
    return Math.round(montoNumerico * coeficiente * 100) / 100;
  }, [montoNumerico, coeficiente]);

  // Teclado virtual numérico
  const handleDigitPress = (digit: string) => {
    if (activeTab === 'numero') {
      if (numeroInput.length < 2) {
        const next = numeroInput + digit;
        setNumeroInput(next);
        if (next.length === 2) {
          // Cambia automáticamente el foco al monto si ya completó el número de dos dígitos
          setActiveTab('monto');
        }
      }
    } else {
      if (montoInput === '0') {
        setMontoInput(digit);
      } else if (montoInput.length < 5) {
        setMontoInput((prev) => prev + digit);
      }
    }
  };

  const handleBackspace = () => {
    if (activeTab === 'numero') {
      setNumeroInput((prev) => prev.slice(0, -1));
    } else {
      setMontoInput((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
    }
  };

  const handlePresetMonto = (valor: number) => {
    setMontoInput(valor.toString());
  };

  const handleAgregarJugada = () => {
    if (numeroInput.length !== 2) {
      Alert.alert('Número Incompleto', 'El número de jugada debe ser de exactamente 2 dígitos (00 - 99).');
      setActiveTab('numero');
      return;
    }

    if (montoNumerico <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa un monto mayor a $0.');
      setActiveTab('monto');
      return;
    }

    const nuevoTotal = totalApostado + montoNumerico;
    if (nuevoTotal > saldoDisponible) {
      Alert.alert(
        'Saldo Insuficiente',
        `El total ($${nuevoTotal}) supera tu saldo operativo disponible ($${saldoDisponible.toFixed(2)}).`
      );
      return;
    }

    agregarJugada(numeroInput, montoNumerico, premioCalculadoEnVivo);

    // Reset para la siguiente jugada rápida
    setNumeroInput('');
    setActiveTab('numero');
  };

  const handleConfirmarVenta = () => {
    if (jugadas.length === 0) {
      Alert.alert('Carrito Vacío', 'Agrega al menos una jugada antes de confirmar.');
      return;
    }
    navigation.navigate('ConfirmarVenta');
  };

  const renderJugadaItem = ({ item }: { item: JugadaItem }) => (
    <View style={styles.jugadaRow}>
      <View style={styles.numeroBadge}>
        <Text style={styles.numeroBadgeText}>{item.numero}</Text>
      </View>
      <View style={styles.jugadaDetalles}>
        <Text style={styles.jugadaMonto}>Monto: ${item.monto.toFixed(2)}</Text>
        <Text style={styles.jugadaPremio}>Premio: ${item.premioPotencial.toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={styles.btnEliminarJugada}
        onPress={() => eliminarJugada(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.btnEliminarText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        titulo="Punto de Venta"
        subtitulo={`Zona: ${user?.nombreZona || 'General'} | Saldo: $${saldoDisponible.toFixed(2)}`}
      />

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Panel de Entrada Dinámico */}
        <View style={styles.inputCard}>
          <View style={styles.selectorsRow}>
            {/* Input Número */}
            <TouchableOpacity
              style={[
                styles.selectorBox,
                activeTab === 'numero' && styles.selectorBoxActive,
              ]}
              onPress={() => setActiveTab('numero')}
              activeOpacity={0.8}
            >
              <Text style={styles.selectorLabel}>NÚMERO (00-99)</Text>
              <Text style={[styles.selectorValue, numeroInput ? styles.valueReady : styles.valuePlaceholder]}>
                {numeroInput ? numeroInput.padStart(2, '0') : '--'}
              </Text>
            </TouchableOpacity>

            {/* Input Monto */}
            <TouchableOpacity
              style={[
                styles.selectorBox,
                activeTab === 'monto' && styles.selectorBoxActive,
              ]}
              onPress={() => setActiveTab('monto')}
              activeOpacity={0.8}
            >
              <Text style={styles.selectorLabel}>MONTO ($)</Text>
              <Text style={[styles.selectorValue, styles.valueReady]}>
                ${montoNumerico.toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cálculo de Premio en Vivo */}
          <View style={styles.premioBanner}>
            <Text style={styles.premioBannerLabel}>Premio Potencial ({coeficiente}x):</Text>
            <Text style={styles.premioBannerValor}>${premioCalculadoEnVivo.toFixed(2)}</Text>
          </View>

          {/* Botones de Monto Rápido */}
          <View style={styles.presetRow}>
            {PRESET_MONTOS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.presetBtn,
                  montoNumerico === m && styles.presetBtnActive,
                ]}
                onPress={() => handlePresetMonto(m)}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    montoNumerico === m && styles.presetBtnTextActive,
                  ]}
                >
                  ${m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Teclado Numérico Extra Grande para Manejo con Una Mano */}
          <View style={styles.tecladoContainer}>
            <View style={styles.tecladoRow}>
              {['1', '2', '3'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.keyButton}
                  onPress={() => handleDigitPress(d)}
                >
                  <Text style={styles.keyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tecladoRow}>
              {['4', '5', '6'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.keyButton}
                  onPress={() => handleDigitPress(d)}
                >
                  <Text style={styles.keyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tecladoRow}>
              {['7', '8', '9'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.keyButton}
                  onPress={() => handleDigitPress(d)}
                >
                  <Text style={styles.keyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tecladoRow}>
              <TouchableOpacity
                style={[styles.keyButton, styles.keyButtonSpecial]}
                onPress={handleBackspace}
              >
                <Text style={styles.keyTextSpecial}>⌫</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyButton}
                onPress={() => handleDigitPress('0')}
              >
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.keyButton, styles.keyButtonAdd]}
                onPress={handleAgregarJugada}
              >
                <Text style={styles.keyTextAdd}>+ AGREGAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Resumen del Carrito de Jugadas */}
        <View style={styles.carritoContainer}>
          <View style={styles.carritoHeader}>
            <Text style={styles.carritoTitle}>
              Jugadas en Carrito ({jugadas.length})
            </Text>
            {jugadas.length > 0 && (
              <TouchableOpacity onPress={limpiarCarrito}>
                <Text style={styles.vaciarCarritoText}>Vaciar</Text>
              </TouchableOpacity>
            )}
          </View>

          {jugadas.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <Text style={styles.emptyCartText}>No hay jugadas agregadas</Text>
              <Text style={styles.emptyCartSubtext}>Digita un número y monto para comenzar</Text>
            </View>
          ) : (
            <FlatList
              data={jugadas}
              keyExtractor={(item) => item.id}
              renderItem={renderJugadaItem}
              scrollEnabled={false}
            />
          )}

          {/* Resumen Financiero de la Venta Actual */}
          {jugadas.length > 0 && (
            <View style={styles.totalesBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Apostado:</Text>
                <Text style={styles.totalValue}>${totalApostado.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Premio Máx Estimado:</Text>
                <Text style={styles.premioMaxValue}>${maxPremioEstimado.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                style={styles.btnEmitirBoleto}
                onPress={handleConfirmarVenta}
                activeOpacity={0.8}
              >
                <Text style={styles.btnEmitirText}>EMITIR BOLETO (${totalApostado.toFixed(2)})</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  selectorBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  selectorBoxActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#0F2338',
  },
  selectorLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  selectorValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  valueReady: {
    color: COLORS.text,
  },
  valuePlaceholder: {
    color: COLORS.textMuted,
  },
  premioBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  premioBannerLabel: {
    color: '#A7F3D0',
    fontSize: 13,
    fontWeight: '600',
  },
  premioBannerValor: {
    color: '#34D399',
    fontSize: 18,
    fontWeight: '900',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  presetBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  presetBtnTextActive: {
    color: COLORS.text,
  },
  tecladoContainer: {
    gap: 8,
  },
  tecladoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keyButton: {
    flex: 1,
    height: 56,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  keyButtonSpecial: {
    backgroundColor: '#374151',
  },
  keyButtonAdd: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  keyText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
  keyTextSpecial: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  keyTextAdd: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  carritoContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 32,
  },
  carritoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  carritoTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  vaciarCarritoText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCartBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCartText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCartSubtext: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  jugadaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  numeroBadge: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numeroBadgeText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },
  jugadaDetalles: {
    flex: 1,
    marginLeft: 12,
  },
  jugadaMonto: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  jugadaPremio: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  btnEliminarJugada: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7F1D1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnEliminarText: {
    color: '#FECACA',
    fontSize: 14,
    fontWeight: '800',
  },
  totalesBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  premioMaxValue: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  btnEmitirBoleto: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  btnEmitirText: {
    color: '#064E3B',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
