import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface HeadingProps {
  level?: 1 | 2 | 3;
  children: React.ReactNode;
  style?: any;
}

export function Heading({ level = 1, children, style }: HeadingProps) {
  const styles_obj = {
    1: styles.h1,
    2: styles.h2,
    3: styles.h3,
  };

  return <Text style={[styles_obj[level], style]}>{children}</Text>;
}

interface BodyProps {
  size?: 'lg' | 'md' | 'sm';
  children: React.ReactNode;
  style?: any;
}

export function Body({ size = 'md', children, style }: BodyProps) {
  const styles_obj = {
    lg: styles.bodyLg,
    md: styles.bodyMd,
    sm: styles.bodySm,
  };

  return <Text style={[styles_obj[size], style]}>{children}</Text>;
}

export function Label({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: '#0b1c30',
    marginBottom: 16,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: '#0b1c30',
    marginBottom: 12,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0b1c30',
    marginBottom: 8,
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#0b1c30',
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#0b1c30',
  },
  bodySm: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: '#444653',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: '#444653',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
