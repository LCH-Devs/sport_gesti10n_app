import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Brand } from '@/constants/theme';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-+=]).{8,}$/;

export default function OnboardingScreen() {
  const { completeClubOnboarding, loading } = useAuth();
  const [form, setForm] = useState({ titular_nombre: '', titular_apellido: '', cuit_cuil: '', nueva_password: '', confirmar: '' });
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!form.titular_nombre.trim() || !form.titular_apellido.trim()) return setError('Completá el nombre y apellido del titular');
    if (form.cuit_cuil.replace(/\D/g, '').length < 7) return setError('El DNI debe tener al menos 7 dígitos');
    if (!PASSWORD_REGEX.test(form.nueva_password)) return setError('La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo');
    if (form.nueva_password !== form.confirmar) return setError('Las contraseñas no coinciden');
    try {
      await completeClubOnboarding({
        titular_nombre: form.titular_nombre.trim(),
        titular_apellido: form.titular_apellido.trim(),
        // Compatibilidad temporal con el nombre histórico del campo en la API.
        cuit_cuil: form.cuit_cuil.replace(/\D/g, ''),
        nueva_password: form.nueva_password,
      });
      router.replace('/admin/' as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro');
    }
  }

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>ClubConnect</Text>
      <Text style={styles.title}>Completá el registro del club</Text>
      <Text style={styles.subtitle}>Estos datos se solicitan solo en el primer acceso.</Text>
      <View style={styles.form}>
        <Field label="Nombre del titular" value={form.titular_nombre} onChangeText={(v) => setForm({ ...form, titular_nombre: v })} />
        <Field label="Apellido del titular" value={form.titular_apellido} onChangeText={(v) => setForm({ ...form, titular_apellido: v })} />
        <Field label="DNI del titular" value={form.cuit_cuil} onChangeText={(v) => setForm({ ...form, cuit_cuil: v })} keyboardType="numeric" />
        <Field label="Nueva contraseña" value={form.nueva_password} onChangeText={(v) => setForm({ ...form, nueva_password: v })} secureTextEntry />
        <Field label="Confirmar contraseña" value={form.confirmar} onChangeText={(v) => setForm({ ...form, confirmar: v })} secureTextEntry />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar y continuar</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'numeric'; secureTextEntry?: boolean }) {
  return <View><Text style={styles.label}>{props.label}</Text><TextInput {...props} style={styles.input} placeholderTextColor="#9aa4b2" /></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Brand.surface }, content: { padding: 24, paddingTop: 70 }, brand: { color: Brand.primary, fontSize: 20, fontWeight: '700', textAlign: 'center' }, title: { color: Brand.text, fontSize: 25, fontWeight: '700', textAlign: 'center', marginTop: 28 }, subtitle: { color: Brand.muted, textAlign: 'center', marginTop: 8, marginBottom: 24 }, form: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 16, padding: 18 }, label: { color: Brand.text, fontSize: 13, fontWeight: '600', marginTop: 10, marginBottom: 7 }, input: { height: 48, borderColor: '#c4c5d5', borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, color: Brand.text, fontSize: 15 }, error: { color: '#ba1a1a', fontSize: 13, marginTop: 12 }, button: { height: 48, borderRadius: 8, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' } });
