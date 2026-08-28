import { AdminSection } from './socios';
export default function FinanzasScreen() { return <AdminSection title="Finanzas" subtitle="Cobros y liquidaciones" icon="cash-outline" metrics={[["$ 1,2M", "Recaudación mensual"], ["86%", "Cuotas al día"], ["14", "Pendientes"]]} />; }
