import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Body, Heading } from './common';

interface ActivityCardProps {
  title: string;
  date: string;
  time: string;
  onPress?: () => void;
}

export function ActivityCard({ title, date, time, onPress }: ActivityCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.container}>
        <View style={styles.dateBox}>
          <Heading level={3} style={styles.dateMonth}>
            {date.split(' ')[0].toUpperCase()}
          </Heading>
          <Heading level={2} style={styles.dateDay}>
            {date.split(' ')[1]}
          </Heading>
        </View>

        <View style={styles.content}>
          <Heading level={3}>{title}</Heading>
          <Body size="sm" style={styles.time}>
            🕐 {time}
          </Body>
        </View>

        <Text style={styles.arrow}>›</Text>
      </Card>
    </TouchableOpacity>
  );
}

import { Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dateBox: {
    width: 60,
    height: 60,
    backgroundColor: '#00288e',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateMonth: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 14,
  },
  dateDay: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 28,
  },
  content: {
    flex: 1,
  },
  time: {
    color: '#444653',
    marginTop: 4,
  },
  arrow: {
    fontSize: 24,
    color: '#dce9ff',
  },
});
