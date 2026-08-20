// User & Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'member' | 'coach' | 'admin' | 'super_admin';
}

// Club Management
export interface Club {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  disciplines: Discipline[];
  status: 'active' | 'under_review' | 'inactive';
  memberCount: number;
}

export interface Discipline {
  id: string;
  name: string;
  icon?: string;
  category: string;
}

// Membership
export interface Membership {
  id: string;
  userId: string;
  clubId: string;
  status: 'active' | 'inactive' | 'suspended';
  type: 'basic' | 'premium';
  joinDate: string;
  expiryDate?: string;
}

export interface MemberID {
  id: string;
  memberId: string;
  qrCode: string;
  barcode: string;
  club: Club;
  member: User;
  status: 'active' | 'expired';
}

// Schedules & Events
export interface Schedule {
  id: string;
  clubId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location: string;
  instructor?: User;
  capacity?: number;
  registered: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Event {
  id: string;
  clubId: string;
  title: string;
  description: string;
  image?: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registered: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registrationDeadline?: string;
}

// Payments & Finances
export interface Transaction {
  id: string;
  userId: string;
  clubId: string;
  amount: number;
  currency: string;
  type: 'membership' | 'event' | 'service' | 'refund';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  createdAt: string;
  description: string;
}

export interface Invoice {
  id: string;
  clubId: string;
  userId: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// News & Notifications
export interface News {
  id: string;
  clubId: string;
  title: string;
  content: string;
  image?: string;
  category: string;
  publishedAt: string;
  createdBy: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

// Theme & Design System
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  textColor: string;
}
