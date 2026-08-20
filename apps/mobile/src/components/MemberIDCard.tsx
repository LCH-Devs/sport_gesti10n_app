import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Card, Badge, Body, Heading } from './common';

interface MemberIDCardProps {
  memberName: string;
  memberId: string;
  status: 'active' | 'inactive';
  avatar?: string;
  clubName?: string;
}

export function MemberIDCard({
  memberName,
  memberId,
  status,
  avatar,
  clubName = 'Elite Athletics Club',
}: MemberIDCardProps) {
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Heading level={2}>Member ID</Heading>
        <Badge
          label={status === 'active' ? 'Active' : 'Inactive'}
          variant={status === 'active' ? 'success' : 'warning'}
        />
      </View>

      <Body style={styles.idText}>{`ID: ${memberId}`}</Body>

      {avatar && (
        <Image
          source={{ uri: avatar }}
          style={styles.avatar}
        />
      )}

      <View style={styles.avatarPlaceholder}>
        <Text style={styles.initials}>
          {memberName
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </Text>
      </View>

      <Heading level={3} style={styles.name}>
        {memberName}
      </Heading>

      <Body size="sm" style={styles.membership}>
        Premium Membership
      </Body>

      <View style={styles.barcodeContainer}>
        <Text style={styles.barcode}>|||||||||||||||||||</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  idText: {
    color: '#444653',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5eeff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  initials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#00288e',
  },
  name: {
    textAlign: 'center',
    marginBottom: 4,
  },
  membership: {
    textAlign: 'center',
    color: '#444653',
    marginBottom: 16,
  },
  barcodeContainer: {
    backgroundColor: '#e5eeff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  barcode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0b1c30',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
});
