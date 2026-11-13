import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../features/auth/LoginScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { VentaRapidaScreen } from '../features/pos/VentaRapidaScreen';
import { PlaceholderScreen } from '../features/placeholder/PlaceholderScreen';
import { COLORS } from '../theme/colors';
import { useAppStore } from '../store/appStore';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  VentaRapida: undefined;
  ConfirmarVenta: { title?: string; desc?: string } | undefined;
  Historial: { title?: string; desc?: string } | undefined;
  Impresora: { title?: string; desc?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Home' : 'Login'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="VentaRapida" component={VentaRapidaScreen} />
            <Stack.Screen
              name="ConfirmarVenta"
              component={PlaceholderScreen}
              initialParams={{
                title: 'Confirmar Transacción',
                desc: 'Emisión de Boleto y Sorteo Activo (Issue #38)',
              }}
            />
            <Stack.Screen
              name="Historial"
              component={PlaceholderScreen}
              initialParams={{
                title: 'Historial del Turno',
                desc: 'Boletos del turno y anulación (Issue #39)',
              }}
            />
            <Stack.Screen
              name="Impresora"
              component={PlaceholderScreen}
              initialParams={{
                title: 'Impresora Bluetooth',
                desc: 'Emparejamiento y conexión térmica (Issue #40)',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
