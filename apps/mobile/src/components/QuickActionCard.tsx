import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Card, Body } from './common';

interface QuickActionCardProps {
  icon: string;
  label: string;
  onPress?: () => void;
}

export function QuickActionCard({ icon, label, onPress }: QuickActionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Body size="sm" style={styles.label}>
          {label}
        </Body>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 12,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e5eeff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#0b1c30',
  },
});
