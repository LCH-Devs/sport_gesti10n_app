import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Brand } from '@/constants/theme';

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clubSlug, setClubSlug] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    try {
      await signIn(email, password, clubSlug);
      router.replace('/(tabs)' as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revisá tus datos e intentá nuevamente');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>C</Text></View>
      <Text style={styles.brand}>ClubConnect</Text>
      <Text style={styles.title}>Ingresá a tu club</Text>
      <Text style={styles.subtitle}>Accedé a tu credencial, horarios y pagos.</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor="#9aa4b2" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Tu contraseña" placeholderTextColor="#9aa4b2" secureTextEntry style={styles.input} />
        <Text style={styles.label}>Club (opcional)</Text>
        <TextInput value={clubSlug} onChangeText={setClubSlug} placeholder="slug-del-club" placeholderTextColor="#9aa4b2" autoCapitalize="none" style={styles.input} />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={submit} disabled={loading || !email || !password} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Ingresar</Text>}
        </TouchableOpacity>
      </View>
      <Text style={styles.help}>¿Necesitás ayuda? Contactá a la administración de tu club.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface, paddingHorizontal: 24, justifyContent: 'center' },
  brandMark: { alignSelf: 'center', width: 64, height: 64, borderRadius: 20, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brandMarkText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  brand: { color: Brand.primary, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  title: { color: Brand.text, textAlign: 'center', fontSize: 26, fontWeight: '700', marginTop: 34 },
  subtitle: { color: Brand.muted, textAlign: 'center', fontSize: 14, marginTop: 8, marginBottom: 28 },
  form: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 16, padding: 18 },
  label: { color: Brand.text, fontSize: 13, fontWeight: '600', marginBottom: 7, marginTop: 10 },
  input: { height: 48, borderColor: '#c4c5d5', borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, color: Brand.text, fontSize: 15 },
  error: { color: '#ba1a1a', fontSize: 13, marginTop: 12 },
  button: { height: 48, borderRadius: 8, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  help: { color: Brand.muted, fontSize: 12, textAlign: 'center', marginTop: 20 },
});
