import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MobileLayout } from '../../components/MobileLayout';
import { COLORS, SPACING } from '../../theme/colors';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <MobileLayout
      titulo="Terminal de Venta"
      subtitulo="Selecciona una acción operativa rápida"
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Botón Principal Ergonómico: Emisión Rápida */}
        <TouchableOpacity
          style={styles.mainActionButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('VentaRapida')}
        >
          <Text style={styles.actionBadge}>VENTA PRINCIPAL</Text>
          <Text style={styles.actionTitle}>Punto de Venta Rápido</Text>
          <Text style={styles.actionDesc}>
            Teclado numérico táctil de dígitos 00-99, cálculo de premios y emisión de tickets.
          </Text>
        </TouchableOpacity>

        {/* Acciones Secundarias */}
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.cardButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Historial')}
          >
            <Text style={styles.cardTitle}>Historial del Turno</Text>
            <Text style={styles.cardDesc}>Boletos emitidos, premios y anulación.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Impresora')}
          >
            <Text style={styles.cardTitle}>Hardware Térmico</Text>
            <Text style={styles.cardDesc}>Vincular impresora Bluetooth portátil.</Text>
          </TouchableOpacity>
        </View>

        {/* Panel Informativo de Reglas */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Normas de Operación Segura</Text>
          <Text style={styles.infoText}>
            • El sistema congela las ventas exactamente 5 minutos antes del sorteo.{'\n'}
            • Cada reimpresión imprime una marca de auditoría correlativa (COPIA X).{'\n'}
            • La comisión del vendedor se abona en tiempo real sobre el saldo de crédito.
          </Text>
        </View>
      </ScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  mainActionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  actionBadge: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  actionTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  actionDesc: {
    color: '#bfdbfe',
    fontSize: 13,
    lineHeight: 18,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  cardButton: {
    flex: 0.48,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  cardDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  infoBox: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  infoText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 18,
  },
});
