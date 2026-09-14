import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Brand } from '@/constants/theme';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-+=]).{8,}$/;
const PASSWORD_MESSAGE =
  'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (! @ # $ % & * _ - + =)';

export default function CambiarClaveScreen() {
  const { completeChangePassword, loading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!PASSWORD_REGEX.test(password)) {
      setError(PASSWORD_MESSAGE);
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      await completeChangePassword(currentPassword, password);
      router.replace('/(tabs)' as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Elegí una contraseña nueva</Text>
      <Text style={styles.subtitle}>
        Ingresaste con la clave temporal que te dio el club. Por seguridad, antes de continuar tenés que elegir una propia.
      </Text>
      <View style={styles.form}>
        <Text style={styles.label}>Contraseña actual (la temporal)</Text>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="Contraseña actual"
          placeholderTextColor="#9aa4b2"
          style={styles.input}
        />
        <Text style={styles.label}>Nueva contraseña</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Nueva contraseña"
          placeholderTextColor="#9aa4b2"
          style={styles.input}
        />
        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="Repetí la contraseña"
          placeholderTextColor="#9aa4b2"
          style={styles.input}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={styles.button}
          onPress={submit}
          disabled={loading || !currentPassword || !password || !confirm}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar e ingresar</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface, paddingHorizontal: 24, justifyContent: 'center' },
  title: { color: Brand.text, textAlign: 'center', fontSize: 22, fontWeight: '700' },
  subtitle: { color: Brand.muted, textAlign: 'center', fontSize: 14, marginTop: 10, marginBottom: 24 },
  form: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 16, padding: 18 },
  label: { color: Brand.text, fontSize: 13, fontWeight: '600', marginBottom: 7, marginTop: 10 },
  input: { height: 48, borderColor: '#c4c5d5', borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, color: Brand.text, fontSize: 15 },
  error: { color: '#ba1a1a', fontSize: 13, marginTop: 12 },
  button: { height: 48, borderRadius: 8, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
