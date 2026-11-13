import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { useAppStore } from '../../store/appStore';
import { ScreenHeader } from '../../components/ScreenHeader';
import { api } from '../../api/client';
import { bluetoothService } from '../../services/bluetoothService';
import { EscPosEncoder } from '../../services/escPosEncoder';

interface JugadaHistorial {
  numero: string;
  monto: number;
  premioCalculado: number;
}

interface BoletoHistorial {
  id: number;
  numeroBoleto: string;
  codigoValidacion: string;
  sorteoId: number;
  codigoSorteo: string;
  totalApostado: number;
  totalPremioEstimado: number;
  estado: 'ACTIVO' | 'PREMIADO' | 'NO_PREMIADO' | 'ANULADO';
  fechaEmision: string;
  puedeAnularse: boolean;
  jugadas: JugadaHistorial[];
}

interface TopNumero {
  numero: string;
  totalVendido: number;
  cantidadJugadas: number;
}

interface ResumenTurno {
  totalVendidoTurno: number;
  comisionesGanadas: number;
  saldoOperativoActual: number;
  totalBoletosEmitidos: number;
  totalBoletosAnulados: number;
  cuadriculaPersonal: TopNumero[];
  boletos: BoletoHistorial[];
}

export const HistorialScreen: React.FC = () => {
  const { updateSaldo } = useAppStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ResumenTurno | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [boletoSeleccionado, setBoletoSeleccionado] = useState<BoletoHistorial | null>(null);
  const [anulando, setAnulando] = useState<boolean>(false);
  const [reimprimiendo, setReimprimiendo] = useState<boolean>(false);

  const handleReimprimirBoleto = async (boleto: BoletoHistorial) => {
    try {
      setReimprimiendo(true);
      // 1. Notificación obligatoria al backend para incrementar copias y generar marca antifraude
      const res = await api.post(`/boletos/${boleto.id}/reimprimir`);
      const { marcaAguaCopia } = res.data;

      // 2. Si hay impresora Bluetooth, emitir ticket térmico con la marca de agua
      if (bluetoothService.isConnected()) {
        const ticketPayload = EscPosEncoder.generarTicket({
          numeroBoleto: boleto.numeroBoleto,
          codigoValidacion: boleto.codigoValidacion,
          sorteoCodigo: boleto.codigoSorteo,
          fechaEmision: boleto.fechaEmision,
          marcaAguaCopia: marcaAguaCopia, // Ej: "COPIA 1", "COPIA 2"
          totalApostado: boleto.totalApostado,
          totalPremioEstimado: boleto.totalPremioEstimado,
          jugadas: boleto.jugadas,
        });

        await bluetoothService.printEscPos(ticketPayload);
        Alert.alert('Reimpresión Exitosa', `Se imprimió el ticket con sello de seguridad '${marcaAguaCopia}'.`);
      } else {
        Alert.alert(
          'Reimpresión Registrada',
          `Se registró ${marcaAguaCopia} en el servidor. Conecta una impresora térmica para sacar la copia física.`
        );
      }

      await cargarDatos();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al solicitar reimpresión.';
      Alert.alert('Error', msg);
    } finally {
      setReimprimiendo(false);
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const res = await api.get<ResumenTurno>('/boletos/historial-turno');
      setData(res.data);
      if (typeof res.data.saldoOperativoActual === 'number') {
        updateSaldo(res.data.saldoOperativoActual);
      }
    } catch (err: any) {
      console.warn('Error al cargar historial de turno:', err);
      Alert.alert('Error', 'No se pudo obtener el historial del turno.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAnularBoleto = (boleto: BoletoHistorial) => {
    if (!boleto.puedeAnularse) {
      Alert.alert(
        'Anulación No Permitida',
        'Este boleto superó la ventana máxima de 5 minutos o el sorteo ya se encuentra cerrado.'
      );
      return;
    }

    Alert.alert(
      'Confirmar Anulación',
      `¿Deseas anular el boleto ${boleto.numeroBoleto}? Se reembolsarán $${boleto.totalApostado.toFixed(2)} a tu saldo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Anular',
          style: 'destructive',
          onPress: async () => {
            try {
              setAnulando(true);
              const res = await api.post(`/boletos/${boleto.id}/anular`, {
                motivo: 'Anulado por error en digitación del cliente',
              });

              Alert.alert('Boleto Anulado', res.data.mensaje);
              setBoletoSeleccionado(null);
              await cargarDatos();
            } catch (err: any) {
              const msg =
                err.response?.data?.message ||
                err.response?.data?.title ||
                'Error al anular el boleto.';
              Alert.alert('Error', msg);
            } finally {
              setAnulando(false);
            }
          },
        },
      ]
    );
  };

  const boletosFiltrados = (data?.boletos || []).filter((b) => {
    if (filtroEstado === 'TODOS') return true;
    return b.estado === filtroEstado;
  });

  return (
    <View style={styles.container}>
      <ScreenHeader
        titulo="Rendimiento e Historial"
        subtitulo="Ventas de tu turno y auditoría"
      />

      <ScrollView style={styles.content}>
        {/* Tarjetas de Métricas de Rendimiento */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>VENTA DEL TURNO</Text>
            <Text style={styles.metricValue}>
              ${(data?.totalVendidoTurno || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>COMISIÓN GANADA</Text>
            <Text style={[styles.metricValue, { color: COLORS.secondary }]}>
              ${(data?.comisionesGanadas || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.balanceBar}>
          <Text style={styles.balanceLabel}>Saldo Operativo Disponible:</Text>
          <Text style={styles.balanceValue}>
            ${(data?.saldoOperativoActual || 0).toFixed(2)}
          </Text>
        </View>

        {/* Cuadrícula Personal: Top Números Vendidos en el Turno */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>TUS NÚMEROS MÁS VENDIDOS HOY</Text>
          {data?.cuadriculaPersonal && data.cuadriculaPersonal.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topScroll}>
              {data.cuadriculaPersonal.map((n) => (
                <View key={n.numero} style={styles.topChip}>
                  <Text style={styles.topChipNum}>{n.numero}</Text>
                  <Text style={styles.topChipMonto}>${n.totalVendido.toFixed(0)}</Text>
                  <Text style={styles.topChipSub}>{n.cantidadJugadas} jugadas</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>Aún no hay jugadas registradas en este turno.</Text>
          )}
        </View>

        {/* Filtro de Boletos */}
        <View style={styles.filtroRow}>
          {['TODOS', 'ACTIVO', 'ANULADO'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filtroBtn,
                filtroEstado === f && styles.filtroBtnActive,
              ]}
              onPress={() => setFiltroEstado(f)}
            >
              <Text
                style={[
                  styles.filtroBtnText,
                  filtroEstado === f && styles.filtroBtnTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.btnRecargar} onPress={cargarDatos}>
            <Text style={styles.btnRecargarText}>↻ Actualizar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Boletos */}
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />
        ) : boletosFiltrados.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay boletos en esta categoría.</Text>
          </View>
        ) : (
          boletosFiltrados.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.boletoCard}
              onPress={() => setBoletoSeleccionado(b)}
              activeOpacity={0.8}
            >
              <View style={styles.boletoHeader}>
                <Text style={styles.boletoNum}>{b.numeroBoleto}</Text>
                <View
                  style={[
                    styles.estadoBadge,
                    {
                      backgroundColor:
                        b.estado === 'ACTIVO'
                          ? '#064E3B'
                          : b.estado === 'ANULADO'
                          ? '#7F1D1D'
                          : '#1F2937',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.estadoBadgeText,
                      {
                        color:
                          b.estado === 'ACTIVO'
                            ? '#34D399'
                            : b.estado === 'ANULADO'
                            ? '#FECACA'
                            : '#9CA3AF',
                      },
                    ]}
                  >
                    {b.estado}
                  </Text>
                </View>
              </View>

              <View style={styles.boletoInfoRow}>
                <Text style={styles.boletoSub}>Sorteo: {b.codigoSorteo}</Text>
                <Text style={styles.boletoSub}>
                  {new Date(b.fechaEmision).toLocaleTimeString()}
                </Text>
              </View>

              <View style={styles.boletoTotalesRow}>
                <Text style={styles.boletoMonto}>Apostado: ${b.totalApostado.toFixed(2)}</Text>
                <Text style={styles.boletoPremio}>Máx: ${b.totalPremioEstimado.toFixed(2)}</Text>
              </View>

              {b.puedeAnularse && (
                <View style={styles.anularAvisoBox}>
                  <Text style={styles.anularAvisoText}>⚡ Disponible para anulación inmediata</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal Detalle de Boleto */}
      <Modal
        visible={!!boletoSeleccionado}
        transparent
        animationType="slide"
        onRequestClose={() => setBoletoSeleccionado(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {boletoSeleccionado && (
              <>
                <Text style={styles.modalTitle}>DETALLE DEL BOLETO</Text>
                <Text style={styles.modalTicketNum}>{boletoSeleccionado.numeroBoleto}</Text>
                <Text style={styles.modalHash}>HASH: {boletoSeleccionado.codigoValidacion}</Text>
                <Text style={styles.modalSub}>Sorteo: {boletoSeleccionado.codigoSorteo}</Text>
                <Text style={styles.modalSub}>
                  Hora: {new Date(boletoSeleccionado.fechaEmision).toLocaleString()}
                </Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalSubTitle}>JUGADAS:</Text>
                {boletoSeleccionado.jugadas.map((j, idx) => (
                  <View key={idx} style={styles.modalJugadaRow}>
                    <Text style={styles.modalJugadaNum}>Número {j.numero}</Text>
                    <Text style={styles.modalJugadaMonto}>${j.monto.toFixed(2)}</Text>
                    <Text style={styles.modalJugadaPremio}>Premio: ${j.premioCalculado.toFixed(2)}</Text>
                  </View>
                ))}

                <View style={styles.modalDivider} />

                <View style={styles.modalTotalRow}>
                  <Text style={styles.modalTotalLabel}>TOTAL:</Text>
                  <Text style={styles.modalTotalValue}>
                    ${boletoSeleccionado.totalApostado.toFixed(2)}
                  </Text>
                </View>

                {/* Botón de Reimpresión Térmica Antifraude */}
                <TouchableOpacity
                  style={[styles.btnReimprimirBoleto, reimprimiendo && styles.btnDisabled]}
                  onPress={() => handleReimprimirBoleto(boletoSeleccionado)}
                  disabled={reimprimiendo}
                >
                  {reimprimiendo ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.btnReimprimirBoletoText}>🖨️ REIMPRIMIR COPIA TÉRMICA</Text>
                  )}
                </TouchableOpacity>

                {boletoSeleccionado.puedeAnularse && (
                  <TouchableOpacity
                    style={[styles.btnAnularBoleto, anulando && styles.btnDisabled]}
                    onPress={() => handleAnularBoleto(boletoSeleccionado)}
                    disabled={anulando}
                  >
                    {anulando ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.btnAnularBoletoText}>ANULAR BOLETO (-5 MIN)</Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.btnCerrarModal}
                  onPress={() => setBoletoSeleccionado(null)}
                >
                  <Text style={styles.btnCerrarModalText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  balanceBar: {
    backgroundColor: '#0F2338',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  balanceLabel: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  balanceValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  topScroll: {
    flexDirection: 'row',
  },
  topChip: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topChipNum: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  topChipMonto: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  topChipSub: {
    color: COLORS.textDim,
    fontSize: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    paddingVertical: 8,
  },
  filtroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    alignItems: 'center',
  },
  filtroBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filtroBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filtroBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  filtroBtnTextActive: {
    color: COLORS.text,
  },
  btnRecargar: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnRecargarText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  boletoCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  boletoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boletoNum: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  estadoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  boletoInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  boletoSub: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  boletoTotalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  boletoMonto: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  boletoPremio: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  anularAvisoBox: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#78350F',
    borderRadius: 6,
  },
  anularAvisoText: {
    color: '#FEF3C7',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalTicketNum: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  modalHash: {
    color: COLORS.textDim,
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  modalSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  modalSubTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalJugadaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalJugadaNum: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  modalJugadaMonto: {
    color: COLORS.text,
    fontSize: 13,
  },
  modalJugadaPremio: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTotalLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  modalTotalValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  btnReimprimirBoleto: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  btnReimprimirBoletoText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  btnAnularBoleto: {
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnAnularBoletoText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  btnCerrarModal: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnCerrarModalText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});
