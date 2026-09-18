import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Brand } from '@/constants/theme';
import { registerSocio, searchClubs, type ClubSearchResult } from '@/lib/api';

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Mismas reglas que el backend (apps/api/src/common/dto-constraints.ts) para no dejar pasar en el cliente lo que el server va a rechazar.
const NOMBRE_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;
const DNI_REGEX = /^\d{7,8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-+=]).{8,}$/;

function validateNombre(v: string) {
  const t = v.trim();
  if (!t) return '';
  if (!NOMBRE_REGEX.test(t)) return 'Solo letras y espacios, sin números ni símbolos';
  if (t.length < 2) return 'Mínimo 2 caracteres';
  return '';
}

function validateDni(v: string) {
  if (!v) return '';
  if (!DNI_REGEX.test(v)) return 'El DNI debe tener 7 u 8 dígitos, sin puntos';
  return '';
}

function validateEmail(v: string) {
  if (!v) return '';
  if (!EMAIL_REGEX.test(v.trim())) return 'Ingresá un email válido';
  return '';
}

function validatePassword(v: string) {
  if (!v) return '';
  if (!PASSWORD_REGEX.test(v)) {
    return 'Mínimo 8 caracteres, con mayúscula, minúscula, número y un carácter especial (! @ # $ % & * _ - + =)';
  }
  return '';
}

export default function RegistroScreen() {
  const [form, setForm] = useState({ club_slug: '', club_nombre: '', dni: '', nombre: '', apellido: '', email: '', fecha_nacimiento: '', password: '', confirmar: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [clubs, setClubs] = useState<ClubSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  function markTouched(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  const errors = {
    nombre: validateNombre(form.nombre),
    apellido: validateNombre(form.apellido),
    dni: validateDni(form.dni),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    confirmar: form.confirmar && form.password !== form.confirmar ? 'Las contraseñas no coinciden' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  async function onClubChange(value: string) {
    setForm({ ...form, club_slug: value, club_nombre: '' });
    if (value.trim().length < 2) { setClubs([]); return; }
    setSearching(true);
    try { setClubs(await searchClubs(value)); } catch { setClubs([]); } finally { setSearching(false); }
  }

  function onDateChange(_event: unknown, selected: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    setForm({ ...form, fecha_nacimiento: toIsoDate(selected) });
  }

  async function submit() {
    setError('');
    setTouched({ dni: true, nombre: true, apellido: true, email: true, password: true, confirmar: true });
    if (Object.values(form).some((v) => !v)) return setError('Completá todos los campos');
    if (hasErrors) return setError('Revisá los campos marcados en rojo');
    setLoading(true);
    try {
      await registerSocio({
        club_slug: form.club_slug.trim(),
        dni: form.dni.trim(),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        fecha_nacimiento: form.fecha_nacimiento.trim(),
        password: form.password,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el registro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>ClubConnect</Text>
        {done ? (
          <View style={styles.card}>
            <Text style={styles.title}>Solicitud enviada</Text>
            <Text style={styles.subtitle}>El club debe aprobar tu membresía antes de que puedas ingresar.</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
              <Text style={styles.buttonText}>Volver al login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Registrate como socio</Text>
            <Text style={styles.subtitle}>Tu solicitud quedará pendiente de aprobación por el club.</Text>
            <View style={styles.card}>
              <TextInput
                placeholder="Escribí el nombre de tu club"
                value={form.club_nombre || form.club_slug}
                onChangeText={onClubChange}
                style={styles.input}
              />
              <Text style={styles.hint}>
                {searching ? 'Buscando clubes…' : form.club_nombre ? `✓ ${form.club_nombre}` : 'Empezá a escribir para ver clubes existentes'}
              </Text>
              {(clubs.length > 0 || (form.club_slug.length >= 2 && !form.club_nombre && !searching)) && (
                <View style={styles.dropdown}>
                  {clubs.length > 0 ? (
                    clubs.map((club) => (
                      <TouchableOpacity
                        key={club.id}
                        style={styles.clubOption}
                        onPress={() => { setForm({ ...form, club_slug: club.slug, club_nombre: club.nombre }); setClubs([]); }}
                      >
                        <Text style={styles.clubName}>{club.nombre}</Text>
                        <Text style={styles.clubSlug}>{club.slug}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noResults}>No encontramos un club con ese nombre.</Text>
                  )}
                </View>
              )}

              <TextInput
                placeholder="DNI"
                value={form.dni}
                onChangeText={(v) => setForm({ ...form, dni: v.replace(/\D/g, '') })}
                onBlur={() => markTouched('dni')}
                keyboardType="numeric"
                maxLength={8}
                style={styles.input}
              />
              {touched.dni && !!errors.dni && <Text style={styles.fieldError}>{errors.dni}</Text>}

              <TextInput
                placeholder="Nombre"
                value={form.nombre}
                onChangeText={(v) => setForm({ ...form, nombre: v })}
                onBlur={() => markTouched('nombre')}
                autoCapitalize="words"
                style={styles.input}
              />
              {touched.nombre && !!errors.nombre && <Text style={styles.fieldError}>{errors.nombre}</Text>}

              <TextInput
                placeholder="Apellido"
                value={form.apellido}
                onChangeText={(v) => setForm({ ...form, apellido: v })}
                onBlur={() => markTouched('apellido')}
                autoCapitalize="words"
                style={styles.input}
              />
              {touched.apellido && !!errors.apellido && <Text style={styles.fieldError}>{errors.apellido}</Text>}

              <TextInput
                placeholder="Email"
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                onBlur={() => markTouched('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              {touched.email && !!errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}

              <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={form.fecha_nacimiento ? styles.dateText : styles.datePlaceholder}>
                  {form.fecha_nacimiento || 'Fecha de nacimiento'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={form.fecha_nacimiento ? new Date(form.fecha_nacimiento) : new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onValueChange={onDateChange}
                  onDismiss={() => setShowDatePicker(false)}
                />
              )}

              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="Contraseña"
                  value={form.password}
                  onChangeText={(v) => setForm({ ...form, password: v })}
                  onBlur={() => markTouched('password')}
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.passwordInput]}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Brand.muted} />
                </TouchableOpacity>
              </View>
              {touched.password && !!errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}

              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="Confirmar contraseña"
                  value={form.confirmar}
                  onChangeText={(v) => setForm({ ...form, confirmar: v })}
                  onBlur={() => markTouched('confirmar')}
                  secureTextEntry={!showConfirmar}
                  style={[styles.input, styles.passwordInput]}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmar((v) => !v)}>
                  <Ionicons name={showConfirmar ? 'eye-off' : 'eye'} size={20} color={Brand.muted} />
                </TouchableOpacity>
              </View>
              {touched.confirmar && !!errors.confirmar && <Text style={styles.fieldError}>{errors.confirmar}</Text>}

              {!!error && <Text style={styles.error}>{error}</Text>}
              <TouchableOpacity style={styles.button} onPress={submit} disabled={loading || !form.club_nombre || hasErrors}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar solicitud</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.back}>Ya tengo cuenta</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { padding: 24, paddingTop: 70 },
  brand: { color: Brand.primary, textAlign: 'center', fontSize: 20, fontWeight: '700', marginBottom: 28 },
  title: { color: Brand.text, fontSize: 25, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: Brand.muted, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  card: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 16, padding: 18 },
  input: { height: 46, borderColor: '#c4c5d5', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginTop: 9, color: Brand.text, justifyContent: 'center' },
  dateText: { color: Brand.text },
  datePlaceholder: { color: '#8a8b98' },
  passwordWrapper: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 44 },
  eyeButton: { position: 'absolute', right: 12, top: 9, height: 46, justifyContent: 'center' },
  hint: { color: Brand.muted, fontSize: 11, marginTop: 5 },
  dropdown: { borderColor: Brand.primary, borderWidth: 1, borderRadius: 8, padding: 4, marginTop: 6, backgroundColor: '#fff' },
  clubOption: { padding: 10, backgroundColor: '#eef2ff', borderRadius: 6, margin: 2 },
  clubName: { color: Brand.text, fontWeight: '700' },
  clubSlug: { color: Brand.muted, fontSize: 11, marginTop: 2 },
  noResults: { color: Brand.muted, fontSize: 12, padding: 10 },
  error: { color: '#ba1a1a', fontSize: 13, marginTop: 12 },
  fieldError: { color: '#ba1a1a', fontSize: 11, marginTop: 4 },
  button: { height: 48, borderRadius: 8, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '700' },
  back: { color: Brand.primary, textAlign: 'center', fontWeight: '700', marginTop: 18 },
});
