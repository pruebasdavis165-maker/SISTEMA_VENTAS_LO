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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../theme/colors';
import { useAppStore } from '../../store/appStore';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { ScreenHeader } from '../../components/ScreenHeader';
import { api } from '../../api/client';
import { bluetoothService } from '../../services/bluetoothService';
import { EscPosEncoder } from '../../services/escPosEncoder';
import { BoletoEmitido, SorteoActivo } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ConfirmarVenta'>;

export const ConfirmarVentaScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, jugadas, limpiarCarrito, updateSaldo, setSorteoActual } = useAppStore();

  const [sorteo, setSorteo] = useState<SorteoActivo | null>(null);
  const [loadingSorteo, setLoadingSorteo] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [boletoEmitido, setBoletoEmitido] = useState<BoletoEmitido | null>(null);

  const totalApostado = jugadas.reduce((sum, j) => sum + j.monto, 0);
  const maxPremio = jugadas.reduce((max, j) => (j.premioPotencial > max ? j.premioPotencial : max), 0);

  // Consulta automática del próximo sorteo activo
  const cargarProximoSorteo = async () => {
    try {
      setLoadingSorteo(true);
      const res = await api.get<SorteoActivo>('/sorteos/proximo');
      if (res.data) {
        setSorteo(res.data);
        setSorteoActual(res.data);
      } else {
        setSorteo(null);
        setSorteoActual(null);
      }
    } catch (err: any) {
      console.warn('Error al consultar sorteo activo:', err);
    } finally {
      setLoadingSorteo(false);
    }
  };

  useEffect(() => {
    cargarProximoSorteo();
  }, []);

  const minutosRestantes = sorteo?.minutosRestantes ?? 0;
  const ventaBloqueada = !sorteo || sorteo.bloqueadoParaVenta || minutosRestantes <= 5;

  const handleEmitirBoleto = async () => {
    if (jugadas.length === 0) {
      Alert.alert('Error', 'No hay jugadas en el carrito.');
      return;
    }

    if (!sorteo) {
      Alert.alert('Sorteo No Disponible', 'No hay sorteos abiertos en este momento para recibir ventas.');
      return;
    }

    if (ventaBloqueada) {
      Alert.alert(
        'Venta Bloqueada',
        `El sorteo ${sorteo.codigo} ha entrado en la ventana de cierre reglamentaria (-5 minutos). No se admiten más jugadas.`
      );
      return;
    }

    const saldo = user?.saldoCredito ?? 0;
    if (totalApostado > saldo) {
      Alert.alert(
        'Saldo Insuficiente',
        `Tu saldo operativo ($${saldo.toFixed(2)}) no cubre el total de las jugadas ($${totalApostado.toFixed(2)}).`
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        sorteoId: sorteo.id,
        jugadas: jugadas.map((j) => ({
          numero: j.numero,
          monto: j.monto,
        })),
      };

      const res = await api.post<any>('/boletos/emitir', payload);
      const data = res.data;

      // Actualizar saldo operativo del vendedor en el estado global
      if (typeof data.nuevoSaldoCredito === 'number') {
        updateSaldo(data.nuevoSaldoCredito);
      }

      setBoletoEmitido({
        id: data.boletoId,
        numeroBoleto: data.numeroBoleto,
        codigoValidacion: data.codigoValidacion,
        sorteoCodigo: data.codigoSorteo,
        totalApostado: data.totalApostado,
        totalPremioEstimado: data.totalPremioEstimado,
        fechaEmision: data.fechaEmision,
        estado: 'ACTIVO',
        copiasImpresas: 0,
        jugadas: data.jugadas.map((item: any) => ({
          numero: item.numero,
          monto: item.monto,
          premioCalculado: item.premioCalculado,
        })),
      });

      // Disparo automático a la mini-impresora Bluetooth si está emparejada (Hardware Invisible)
      if (bluetoothService.isConnected()) {
        const escPosPayload = EscPosEncoder.generarTicket({
          numeroBoleto: data.numeroBoleto,
          codigoValidacion: data.codigoValidacion,
          sorteoCodigo: data.codigoSorteo,
          fechaEmision: data.fechaEmision,
          nombreZona: user?.nombreZona,
          nombreVendedor: user ? `${user.nombres} ${user.apellidos}` : undefined,
          marcaAguaCopia: null, // Original sin marca
          totalApostado: data.totalApostado,
          totalPremioEstimado: data.totalPremioEstimado,
          jugadas: data.jugadas.map((item: any) => ({
            numero: item.numero,
            monto: item.monto,
            premioCalculado: item.premioCalculado,
          })),
        });
        await bluetoothService.printEscPos(escPosPayload);
      }

      limpiarCarrito();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Ocurrió un error al procesar el boleto.';
      Alert.alert('Rechazo de Transacción', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizar = () => {
    setBoletoEmitido(null);
    navigation.navigate('VentaRapida');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        titulo="Confirmación de Transacción"
        subtitulo="Verifica los datos antes del despacho"
      />

      <ScrollView style={styles.content}>
        {/* Estado del Sorteo Activo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SORTEO ASIGNADO</Text>
          {loadingSorteo ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
          ) : sorteo ? (
            <View>
              <View style={styles.sorteoInfoRow}>
                <Text style={styles.sorteoCodigo}>{sorteo.codigo}</Text>
                <View
                  style={[
                    styles.tagEstado,
                    { backgroundColor: ventaBloqueada ? '#7F1D1D' : '#064E3B' },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagEstadoText,
                      { color: ventaBloqueada ? '#FECACA' : '#A7F3D0' },
                    ]}
                  >
                    {ventaBloqueada ? 'VENTA CERRADA' : 'ABIERTO'}
                  </Text>
                </View>
              </View>

              <Text style={styles.sorteoDetalle}>
                Fecha: {sorteo.fecha} | Cierre: {sorteo.horaCierre}
              </Text>

              {minutosRestantes <= 15 && (
                <View
                  style={[
                    styles.avisoCierre,
                    minutosRestantes <= 5 && styles.avisoCierreCritico,
                  ]}
                >
                  <Text style={styles.avisoCierreText}>
                    {minutosRestantes <= 5
                      ? '⚠️ TIEMPO LÍMITE SUPERADO (-5 MIN). APUESTAS CONGELADAS.'
                      : `⏱️ Cierre inminente: restan ${Math.round(minutosRestantes)} minutos.`}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.errorText}>No hay sorteos programados disponibles.</Text>
          )}
        </View>

        {/* Modal / Panel de Éxito si ya fue emitido */}
        {boletoEmitido ? (
          <View style={styles.successCard}>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>✓ BOLETO EMITIDO CON ÉXITO</Text>
            </View>

            <View style={styles.ticketBox}>
              <Text style={styles.ticketHeader}>COMPROBANTE DE APUESTA</Text>
              <Text style={styles.ticketNumero}>N°: {boletoEmitido.numeroBoleto}</Text>
              <Text style={styles.ticketHash}>HASH: {boletoEmitido.codigoValidacion}</Text>
              <Text style={styles.ticketSub}>Sorteo: {boletoEmitido.sorteoCodigo}</Text>
              <Text style={styles.ticketSub}>
                Emisión: {new Date(boletoEmitido.fechaEmision).toLocaleTimeString()}
              </Text>

              <View style={styles.ticketDivider} />

              {boletoEmitido.jugadas.map((j, idx) => (
                <View key={idx} style={styles.ticketJugadaRow}>
                  <Text style={styles.ticketJugadaNum}>N° {j.numero}</Text>
                  <Text style={styles.ticketJugadaMonto}>${j.monto.toFixed(2)}</Text>
                  <Text style={styles.ticketJugadaPremio}>Premio: ${j.premioCalculado.toFixed(2)}</Text>
                </View>
              ))}

              <View style={styles.ticketDivider} />

              <View style={styles.ticketTotalRow}>
                <Text style={styles.ticketTotalLabel}>TOTAL PAGADO:</Text>
                <Text style={styles.ticketTotalValue}>${boletoEmitido.totalApostado.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.btnNuevaVenta}
              onPress={handleFinalizar}
              activeOpacity={0.8}
            >
              <Text style={styles.btnNuevaVentaText}>REALIZAR OTRA VENTA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Resumen de Jugadas a Emitir */
          <View style={styles.card}>
            <Text style={styles.cardTitle}>DETALLE DE LA APUESTA ({jugadas.length})</Text>

            {jugadas.map((j) => (
              <View key={j.id} style={styles.resumenRow}>
                <View style={styles.numBadge}>
                  <Text style={styles.numBadgeText}>{j.numero}</Text>
                </View>
                <View style={styles.detallesCol}>
                  <Text style={styles.montoText}>Apostado: ${j.monto.toFixed(2)}</Text>
                  <Text style={styles.premioText}>Premio Estimado: ${j.premioPotencial.toFixed(2)}</Text>
                </View>
              </View>
            ))}

            <View style={styles.totalFinalBox}>
              <View style={styles.filaTotal}>
                <Text style={styles.labelTotal}>Total a Descontar de Saldo:</Text>
                <Text style={styles.valorTotal}>${totalApostado.toFixed(2)}</Text>
              </View>
              <View style={styles.filaTotal}>
                <Text style={styles.labelTotal}>Premio Máximo Posible:</Text>
                <Text style={styles.valorPremioMax}>${maxPremio.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.btnConfirmar,
                (ventaBloqueada || submitting || jugadas.length === 0) && styles.btnDisabled,
              ]}
              onPress={handleEmitirBoleto}
              disabled={ventaBloqueada || submitting || jugadas.length === 0}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.btnConfirmarText}>
                  CONFIRMAR Y EMITIR BOLETO (${totalApostado.toFixed(2)})
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnVolver}
              onPress={() => navigation.navigate('VentaRapida')}
            >
              <Text style={styles.btnVolverText}>← Modificar Jugadas</Text>
            </TouchableOpacity>
          </View>
        )}
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sorteoInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sorteoCodigo: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  tagEstado: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagEstadoText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sorteoDetalle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  avisoCierre: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#78350F',
    borderRadius: 8,
  },
  avisoCierreCritico: {
    backgroundColor: '#7F1D1D',
  },
  avisoCierreText: {
    color: '#FEF3C7',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
  },
  resumenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  numBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numBadgeText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  detallesCol: {
    marginLeft: 12,
    flex: 1,
  },
  montoText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  premioText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  totalFinalBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  filaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelTotal: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  valorTotal: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  valorPremioMax: {
    color: COLORS.secondary,
    fontSize: 18,
    fontWeight: '900',
  },
  btnConfirmar: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  btnDisabled: {
    backgroundColor: '#374151',
    opacity: 0.6,
  },
  btnConfirmarText: {
    color: '#064E3B',
    fontSize: 15,
    fontWeight: '900',
  },
  btnVolver: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  btnVolverText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  successCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#059669',
    marginBottom: 24,
  },
  successBadge: {
    backgroundColor: '#064E3B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  successBadgeText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '800',
  },
  ticketBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  ticketHeader: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  ticketNumero: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  ticketHash: {
    color: '#4B5563',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  ticketSub: {
    color: '#374151',
    fontSize: 12,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  ticketJugadaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ticketJugadaNum: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  ticketJugadaMonto: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
  ticketJugadaPremio: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  ticketTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTotalLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  ticketTotalValue: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
  },
  btnNuevaVenta: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  btnNuevaVentaText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
});
