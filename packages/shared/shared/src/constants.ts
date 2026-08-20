// Design System - Kinetic Institutional (Mobile)
export const COLORS_MOBILE = {
  primary: '#00288e',
  onPrimary: '#ffffff',
  primaryContainer: '#1e40af',
  secondary: '#fd761a',
  onSecondary: '#ffffff',
  secondaryContainer: '#9d4300',
  tertiary: '#611e00',
  surface: '#f8f9ff',
  onSurface: '#0b1c30',
  background: '#f8f9ff',
  error: '#ba1a1a',
};

// Design System - Athletic Utility System (Web)
export const COLORS_WEB = {
  primary: '#003ec7',
  onPrimary: '#ffffff',
  primaryContainer: '#0052ff',
  secondary: '#565e74',
  onSecondary: '#ffffff',
  surface: '#f7f9fb',
  onSurface: '#191c1e',
  background: '#f7f9fb',
  error: '#ba1a1a',
};

// Status Badges
export const STATUS_COLORS = {
  active: '#10b981',
  inactive: '#6b7280',
  pending: '#f59e0b',
  suspended: '#ef4444',
  underReview: '#8b5cf6',
} as const;

// Routes
export const ROUTES = {
  // Mobile
  MOBILE_HOME: '/',
  MOBILE_CREDENTIALS: '/credentials',
  MOBILE_SCHEDULES: '/schedules',
  MOBILE_PAYMENTS: '/payments',
  MOBILE_PROFILE: '/profile',

  // Web
  WEB_DASHBOARD: '/dashboard',
  WEB_CLUBS: '/clubs',
  WEB_USERS: '/users',
  WEB_SCHEDULES: '/schedules',
  WEB_NEWS: '/news',
  WEB_ANALYTICS: '/analytics',
  WEB_REPORTS: '/reports',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MMM DD',
  MEDIUM: 'MMM DD, YYYY',
  LONG: 'MMMM DD, YYYY',
  TIME: 'HH:mm',
  DATETIME: 'MMM DD, YYYY HH:mm',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  CLUBS: '/api/clubs',
  SCHEDULES: '/api/schedules',
  EVENTS: '/api/events',
  PAYMENTS: '/api/payments',
  NEWS: '/api/news',
  NOTIFICATIONS: '/api/notifications',
} as const;
