import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../theme/colors';
import { ScreenHeader } from './ScreenHeader';

interface MobileLayoutProps {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  titulo,
  subtitulo,
  children,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader titulo={titulo} subtitulo={subtitulo} />
        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
});
