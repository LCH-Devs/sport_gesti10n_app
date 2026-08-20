import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';

export function ScreenHeader() {
  const { language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.headerTitle}>ClubConnect</Text>
      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => setLanguage(language === 'es' ? 'en' : 'es')}
      >
        <Text style={styles.languageText}>{language === 'es' ? 'EN' : 'ES'}</Text>
      </TouchableOpacity>
      <View style={styles.notificationIcon}>
        <Ionicons name="notifications-outline" size={20} color="#00288e" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#dce9ff',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00288e',
  },
  languageButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#e5eeff',
    borderRadius: 16,
    marginHorizontal: 8,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00288e',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
