import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { COLORS, SPACING } from '../theme/colors';
import { useAppStore } from '../store/appStore';

interface ScreenHeaderProps {
  titulo: string;
  subtitulo?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ titulo, subtitulo }) => {
  const { user, sorteoActual, impresoraConectada } = useAppStore();

  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Barra de Estado Operativo Superior */}
      <View style={styles.topStatusRow}>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName} numberOfLines={1}>
            {user ? `${user.nombres} ${user.apellidos}` : 'Vendedor'}
          </Text>
          <Text style={styles.vendorZone}>{user?.nombreZona || 'Zona Principal'}</Text>
        </View>

        <View style={styles.hardwareBadge}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: impresoraConectada ? COLORS.secondary : COLORS.danger },
            ]}
          />
          <Text style={styles.hardwareText}>
            {impresoraConectada ? 'BT Conectado' : 'Sin Impresora'}
          </Text>
        </View>
      </View>

      {/* Fila de Saldo y Sorteo Activo */}
      <View style={styles.metricsRow}>
        <View style={styles.saldoBox}>
          <Text style={styles.metricLabel}>SALDO DISPONIBLE</Text>
          <Text style={styles.saldoValue}>
            ${(user?.saldoCredito || 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.sorteoBox}>
          <Text style={styles.metricLabel}>SORTEO ACTUAL</Text>
          <Text style={styles.sorteoValue}>
            {sorteoActual ? sorteoActual.codigo : 'SIN SORTEO'}
          </Text>
        </View>
      </View>

      {/* Título de la pantalla */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{titulo}</Text>
        {subtitulo && <Text style={styles.subtitle}>{subtitulo}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  vendorZone: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  hardwareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  hardwareText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saldoBox: {
    flex: 1,
  },
  sorteoBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metricLabel: {
    color: COLORS.textDim,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  saldoValue: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  sorteoValue: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  titleSection: {
    marginTop: SPACING.xs,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
