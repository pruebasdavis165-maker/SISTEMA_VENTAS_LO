import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { api } from '../../api/client';
import { useAppStore } from '../../store/appStore';
import { secureStorage } from '../../services/secureStorage';
import { COLORS, SPACING } from '../../theme/colors';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginStore = useAppStore((state) => state.login);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password: password.trim(),
      });

      const { token, usuario } = response.data;

      // Validar rol de VENDEDOR
      if (usuario.rol !== 'VENDEDOR' && usuario.rol !== 'ADMIN') {
        setError('Acceso denegado: esta terminal es exclusiva para vendedores.');
        setLoading(false);
        return;
      }

      const sessionData = {
        id: usuario.id,
        username: usuario.username,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        rol: usuario.rol,
        zonaId: usuario.zonaId,
        nombreZona: usuario.zonaNombre,
        precioBase: usuario.precioBase || 0,
        precioVenta: usuario.precioVenta || 0,
        saldoCredito: usuario.saldoCredito || 0,
        coeficientePremio: usuario.coeficientePremio || 70,
      };

      // Guardar en almacenamiento seguro
      await secureStorage.saveToken(token);
      await secureStorage.saveUser(JSON.stringify(sessionData));

      // Actualizar Zustand
      loginStore(sessionData, token);

      // Navegar a Home
      navigation.replace('Home');
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Error de conexión o credenciales incorrectas.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.card}>
        {/* Cabecera de Marca */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>SISTEMA VENTAS LO</Text>
          <Text style={styles.brandSubtitle}>Terminal Móvil de Venta</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>USUARIO / CÉDULA</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu usuario"
            placeholderTextColor={COLORS.textDim}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>CONTRASEÑA</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textDim}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Botón de Acceso */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Iniciar Turno de Venta</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.securityNotice}>
          Terminal vinculada a la red central de ventas. Conexión cifrada vía JWT.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  brandTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.text,
    fontSize: 15,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  securityNotice: {
    color: COLORS.textDim,
    fontSize: 10,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 14,
  },
});
