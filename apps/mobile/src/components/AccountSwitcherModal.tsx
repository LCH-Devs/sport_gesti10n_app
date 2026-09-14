import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Brand } from '@/constants/theme';

export function AccountSwitcherModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { session, switchAccount, loading } = useAuth();
  const cuentas = session?.cuentas ?? [];

  async function pick(membresiaId: number) {
    await switchAccount(membresiaId);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Cambiar de club</Text>
          {cuentas.map((cuenta) => (
            <TouchableOpacity
              key={cuenta.membresia_id}
              style={styles.item}
              disabled={loading}
              onPress={() => pick(cuenta.membresia_id)}
              activeOpacity={0.7}
            >
              <Text style={styles.itemName}>{cuenta.club.nombre}</Text>
              <Text style={styles.itemRole}>{cuenta.rol}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.close} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  title: { fontSize: 17, fontWeight: '700', color: Brand.text, marginBottom: 14 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eef0f6' },
  itemName: { fontSize: 15, fontWeight: '600', color: Brand.text },
  itemRole: { fontSize: 12, color: Brand.muted, textTransform: 'capitalize' },
  close: { marginTop: 16, alignItems: 'center' },
  closeText: { color: Brand.primary, fontWeight: '600', fontSize: 14 },
});
