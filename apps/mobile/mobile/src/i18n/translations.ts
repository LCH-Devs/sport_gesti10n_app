export const translations = {
  es: {
    // Navigation
    home: 'Inicio',
    schedule: 'Horario',
    payments: 'Pagos',
    profile: 'Perfil',

    // Home Screen
    clubConnect: 'ClubConnect',
    memberId: 'ID del Miembro',
    active: 'Activo',
    premiumMembership: 'Membresía Premium',
    nextActivity: 'Próxima Actividad',
    quickActions: 'Acciones Rápidas',
    history: 'Historial',
    news: 'Noticias',
    events: 'Eventos',
    support: 'Soporte',

    // Schedule Screen
    weeklySchedule: 'Horario Semanal',
    upcomingEvents: 'Próximos Eventos',
    today: 'Hoy',
    tomorrow: 'Mañana',
    featuredEvents: 'Eventos Destacados',
    fallTennisTournament: 'Torneo de Tenis de Otoño',
    tournamentDescription: 'Torneo anual del club para todos los niveles de habilidad. El registro se cierra pronto.',
    registerNow: 'Registrarse Ahora',

    // Payments Screen
    outstandingBalance: 'Saldo Pendiente',
    payNow: 'Pagar Ahora',
    transactionHistory: 'Historial de Transacciones',
    viewAllTransactions: 'Ver Todas las Transacciones',
    monthlyMembership: 'Membresía Mensual',
    personalTrainingSession: 'Sesión de Entrenamiento Personal',
    eliteFitnessCenter: 'Centro de Fitness Elite',
    dueByDate: 'Vencimiento: {date}',

    // Profile Screen
    accountSettings: 'Configuración de Cuenta',
    privacySecurity: 'Privacidad y Seguridad',
    helpSupport: 'Ayuda y Soporte',
    paymentMethods: 'Métodos de Pago',
    editProfile: 'Editar Perfil',
    recentNotifications: 'Notificaciones Recientes',
    premiumMember: 'Miembro Premium',

    // Notifications
    newClassSchedule: 'Nuevo Horario de Clase Disponible',
    classScheduleMessage: 'El horario de la próxima semana para clases de Spinning y Yoga ya está disponible. ¡Reserva tu lugar pronto!',
    paymentConfirmed: 'Pago Confirmado',
    paymentConfirmedMessage: 'Tu cuota de suscripción mensual de $45.00 se procesó exitosamente.',
    facilityMaintenance: 'Mantenimiento de Instalaciones',
    maintenanceMessage: 'La piscina principal estará cerrada para mantenimiento de rutina el martes, 10 de oct.',

    // Time indicators
    hoursAgo: 'hace {hours}h',
    daysAgo: 'hace {days}d',
  },
  en: {
    // Navigation
    home: 'Home',
    schedule: 'Schedule',
    payments: 'Payments',
    profile: 'Profile',

    // Home Screen
    clubConnect: 'ClubConnect',
    memberId: 'Member ID',
    active: 'Active',
    premiumMembership: 'Premium Membership',
    nextActivity: 'Next Activity',
    quickActions: 'Quick Actions',
    history: 'History',
    news: 'News',
    events: 'Events',
    support: 'Support',

    // Schedule Screen
    weeklySchedule: 'Weekly Schedule',
    upcomingEvents: 'Upcoming Events',
    today: 'Today',
    tomorrow: 'Tomorrow',
    featuredEvents: 'Featured Events',
    fallTennisTournament: 'Fall Tennis Tournament',
    tournamentDescription: 'Annual club tournament for all skill levels. Registration closes soon.',
    registerNow: 'Register Now',

    // Payments Screen
    outstandingBalance: 'Outstanding Balance',
    payNow: 'Pay Now',
    transactionHistory: 'Transaction History',
    viewAllTransactions: 'View All Transactions',
    monthlyMembership: 'Monthly Membership',
    personalTrainingSession: 'Personal Training Session',
    eliteFitnessCenter: 'Elite Fitness Center',
    dueByDate: 'Due by {date}',

    // Profile Screen
    accountSettings: 'Account Settings',
    privacySecurity: 'Privacy & Security',
    helpSupport: 'Help & Support',
    paymentMethods: 'Payment Methods',
    editProfile: 'Edit Profile',
    recentNotifications: 'Recent Notifications',
    premiumMember: 'Premium Member',

    // Notifications
    newClassSchedule: 'New Class Schedule Available',
    classScheduleMessage: 'The upcoming week\'s schedule for Spin and Yoga classes is now live. Book your spot early!',
    paymentConfirmed: 'Payment Confirmed',
    paymentConfirmedMessage: 'Your monthly subscription fee of $45.00 was successfully processed.',
    facilityMaintenance: 'Facility Maintenance',
    maintenanceMessage: 'The main pool will be closed for routine maintenance on Tuesday, Oct 10.',

    // Time indicators
    hoursAgo: '{hours}h ago',
    daysAgo: '{days}d ago',
  },
};

export type TranslationKey = keyof typeof translations.es;
