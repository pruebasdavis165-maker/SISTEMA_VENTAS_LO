import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MobileLayout } from '../../components/MobileLayout';
import { COLORS } from '../../theme/colors';

export const PlaceholderScreen: React.FC<{ route: any }> = ({ route }) => {
  const title = route.params?.title || 'Módulo';
  const desc = route.params?.desc || 'En construcción';

  return (
    <MobileLayout titulo={title}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  desc: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
