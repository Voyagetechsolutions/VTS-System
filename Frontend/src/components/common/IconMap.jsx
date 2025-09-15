import React from 'react';
import {
  // Navigation & Layout
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  
  // User & Auth
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  AccountCircle as AccountCircleIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Security as SecurityIcon,
  
  // Transportation & Fleet
  DirectionsBus as BusIcon,
  Route as RouteIcon,
  Map as MapIcon,
  GpsFixed as GpsIcon,
  Traffic as TrafficIcon,
  LocalShipping as TruckIcon,
  Navigation as NavigationIcon,
  Timeline as TimelineIcon,
  
  // Business Operations
  Business as BusinessIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  EventSeat as SeatIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  
  // Communication & Support
  Message as MessageIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Support as SupportIcon,
  Help as HelpIcon,
  Announcement as AnnouncementIcon,
  
  // Financial & Payments
  Payment as PaymentIcon,
  MonetizationOn as MoneyIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  
  // Documents & Reports
  Description as DocumentIcon,
  Folder as FolderIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Assessment as ReportIcon,
  Analytics as AnalyticsIcon,
  
  // Settings & Configuration
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Build as BuildIcon,
  AdminPanelSettings as AdminIcon,
  ManageAccounts as ManageAccountsIcon,
  VpnKey as KeyIcon,
  
  // Status & Alerts
  CheckCircleOutline as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PriorityHigh as PriorityIcon,
  Flag as FlagIcon,
  
  // Actions
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  
  // Time & Calendar
  Today as TodayIcon,
  Schedule as CalendarIcon,
  AccessTime as TimeIcon,
  DateRange as DateRangeIcon,
  Timer as TimerIcon,
  History as HistoryIcon,
  
  // Compliance & Safety
  Shield as ShieldIcon,
  VerifiedUser as VerifiedIcon,
  ReportProblem as IncidentIcon,
  LocalHospital as SafetyIcon,
  Gavel as ComplianceIcon,
  Policy as PolicyIcon,
  
  // Maintenance & Technical
  Build as MaintenanceIcon,
  Engineering as EngineeringIcon,
  BugReport as BugIcon,
  Memory as SystemIcon,
  Storage as DatabaseIcon,
  CloudSync as SyncIcon,
  
  // Miscellaneous
  Star as StarIcon,
  Bookmark as BookmarkIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Launch as LaunchIcon,
  
} from '@mui/icons-material';

// Icon mapping for consistent usage across the application
export const iconMap = {
  // Dashboard & Navigation
  dashboard: DashboardIcon,
  menu: MenuIcon,
  close: CloseIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  expandMore: ExpandMoreIcon,
  expandLess: ExpandLessIcon,
  
  // User Management
  user: PersonIcon,
  userAdd: PersonAddIcon,
  users: GroupIcon,
  account: AccountCircleIcon,
  login: LoginIcon,
  logout: LogoutIcon,
  security: SecurityIcon,
  admin: AdminIcon,
  manageUsers: ManageAccountsIcon,
  
  // Fleet & Transportation
  bus: BusIcon,
  route: RouteIcon,
  routes: RouteIcon,
  map: MapIcon,
  gps: GpsIcon,
  traffic: TrafficIcon,
  truck: TruckIcon,
  navigation: NavigationIcon,
  timeline: TimelineIcon,
  trips: TimelineIcon,
  
  // Business Operations
  business: BusinessIcon,
  company: BusinessIcon,
  store: StoreIcon,
  branches: StoreIcon,
  inventory: InventoryIcon,
  schedule: ScheduleIcon,
  seat: SeatIcon,
  seats: SeatIcon,
  assignment: AssignmentIcon,
  bookings: SeatIcon,
  passengers: GroupIcon,
  
  // Communication
  messages: MessageIcon,
  chat: ChatIcon,
  notifications: NotificationsIcon,
  phone: PhoneIcon,
  email: EmailIcon,
  support: SupportIcon,
  help: HelpIcon,
  announcements: AnnouncementIcon,
  communications: ChatIcon,
  
  // Financial
  payments: PaymentIcon,
  revenue: MoneyIcon,
  billing: ReceiptIcon,
  money: MoneyIcon,
  creditCard: CreditCardIcon,
  bank: BankIcon,
  trendingUp: TrendingUpIcon,
  trendingDown: TrendingDownIcon,
  
  // Documents & Reports
  documents: DocumentIcon,
  document: DocumentIcon,
  folder: FolderIcon,
  upload: UploadIcon,
  download: DownloadIcon,
  pdf: PdfIcon,
  image: ImageIcon,
  reports: ReportIcon,
  analytics: AnalyticsIcon,
  
  // Settings & Configuration
  settings: SettingsIcon,
  tune: TuneIcon,
  build: BuildIcon,
  maintenance: MaintenanceIcon,
  engineering: EngineeringIcon,
  profile: AccountCircleIcon,
  key: KeyIcon,
  
  // Status & Alerts
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
  priority: PriorityIcon,
  flag: FlagIcon,
  verified: VerifiedIcon,
  
  // Actions
  add: AddIcon,
  edit: EditIcon,
  delete: DeleteIcon,
  save: SaveIcon,
  search: SearchIcon,
  filter: FilterIcon,
  sort: SortIcon,
  refresh: RefreshIcon,
  
  // Time & Calendar
  today: TodayIcon,
  calendar: CalendarIcon,
  time: TimeIcon,
  dateRange: DateRangeIcon,
  timer: TimerIcon,
  history: HistoryIcon,
  
  // Compliance & Safety
  shield: ShieldIcon,
  compliance: ComplianceIcon,
  safety: SafetyIcon,
  incidents: IncidentIcon,
  policy: PolicyIcon,
  
  // System & Technical
  system: SystemIcon,
  database: DatabaseIcon,
  sync: SyncIcon,
  bug: BugIcon,
  
  // Status Indicators
  active: CheckCircleIcon,
  inactive: CancelIcon,
  pending: TimeIcon,
  
  // Role-specific icons
  driver: NavigationIcon,
  bookingOffice: SeatIcon,
  operations: AssignmentIcon,
  developer: BuildIcon,
  
  // Miscellaneous
  star: StarIcon,
  bookmark: BookmarkIcon,
  print: PrintIcon,
  share: ShareIcon,
  view: ViewIcon,
  hide: HideIcon,
  launch: LaunchIcon,
};

// Helper component for consistent icon rendering
export const Icon = ({ name, size = 24, color, className, ...props }) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return <HelpIcon style={{ fontSize: size, color }} className={className} {...props} />;
  }
  
  return (
    <IconComponent 
      style={{ fontSize: size, color }} 
      className={className} 
      {...props} 
    />
  );
};

// Role-based navigation configuration
export const roleNavigation = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'fleet', label: 'Fleet Management', icon: 'bus' },
    { id: 'routes', label: 'Route Management', icon: 'route' },
    { id: 'users', label: 'User Management', icon: 'users' },
    { id: 'drivers', label: 'Driver Performance', icon: 'driver' },
    { id: 'maintenance', label: 'Maintenance', icon: 'maintenance' },
    { id: 'reports', label: 'Reports & Analytics', icon: 'reports' },
    { id: 'revenue', label: 'Revenue & Billing', icon: 'revenue' },
    { id: 'notifications', label: 'Notifications & Alerts', icon: 'notifications' },
    { id: 'tripinfo', label: 'Trip Info', icon: 'trips' },
    { id: 'compliance', label: 'Compliance & Safety', icon: 'safety' },
    { id: 'documents', label: 'Documents', icon: 'documents' },
    { id: 'communications', label: 'Communications', icon: 'communications' },
    { id: 'audit', label: 'Audit Trail', icon: 'history' },
    { id: 'branches', label: 'Branches', icon: 'branches' },
    { id: 'settings', label: 'System Settings', icon: 'settings' },
    { id: 'support', label: 'Support', icon: 'support' },
    { id: 'profile', label: 'Profile', icon: 'profile' },
  ],
  
  ops_manager: [
    { id: 'dashboard', label: 'Overview', icon: 'dashboard' },
    { id: 'fleet', label: 'Fleet Management', icon: 'bus' },
    { id: 'routes', label: 'Routes Management', icon: 'route' },
    { id: 'staff', label: 'Staff Management', icon: 'users' },
    { id: 'reports', label: 'Reports & Analytics', icon: 'reports' },
    { id: 'notifications', label: 'Alerts & Notifications', icon: 'notifications' },
    { id: 'tripinfo', label: 'Trip Info', icon: 'trips' },
    { id: 'maintenance', label: 'Maintenance Coordination', icon: 'maintenance' },
    { id: 'shifts', label: 'Shift Scheduling', icon: 'schedule' },
    { id: 'tasks', label: 'Daily Tasks', icon: 'assignment' },
    { id: 'compliance', label: 'Compliance & Safety', icon: 'safety' },
    { id: 'documents', label: 'Documents', icon: 'documents' },
    { id: 'communications', label: 'Communications', icon: 'communications' },
    { id: 'audit', label: 'Audit Trail', icon: 'history' },
    { id: 'settings', label: 'Settings & Preferences', icon: 'settings' },
    { id: 'profile', label: 'Profile', icon: 'profile' },
  ],
  
  booking_officer: [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'newbooking', label: 'New Booking', icon: 'add' },
    { id: 'checkin', label: 'Check-in', icon: 'verified' },
    { id: 'refunds', label: 'Refunds / Cancellations', icon: 'cancel' },
    { id: 'bookings', label: 'Bookings Management', icon: 'bookings' },
    { id: 'passengers', label: 'Passenger Management', icon: 'passengers' },
    { id: 'payments', label: 'Payments & Transactions', icon: 'payments' },
    { id: 'tripinfo', label: 'Trip Information', icon: 'trips' },
    { id: 'routes', label: 'Route & Trip Information', icon: 'route' },
    { id: 'reports', label: 'Reports & Analytics', icon: 'reports' },
    { id: 'notifications', label: 'Notifications & Alerts', icon: 'notifications' },
    { id: 'support', label: 'Support', icon: 'support' },
    { id: 'settings', label: 'Settings & Preferences', icon: 'settings' },
  ],
  
  driver: [
    { id: 'tripinfo', label: 'Trip Info', icon: 'trips' },
    { id: 'trips', label: 'Trips', icon: 'route' },
    { id: 'passengers', label: 'Passenger List', icon: 'passengers' },
    { id: 'status', label: 'Status', icon: 'shield' },
    { id: 'map', label: 'Map', icon: 'map' },
    { id: 'logs', label: 'History', icon: 'history' },
    { id: 'maintenance', label: 'Maintenance', icon: 'maintenance' },
    { id: 'training', label: 'help', icon: 'help' },
    { id: 'performance', label: 'Performance', icon: 'analytics' },
    { id: 'documents', label: 'Documents', icon: 'documents' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'communications', label: 'Communications', icon: 'communications' },
    { id: 'profile', label: 'Profile', icon: 'profile' },
    { id: 'messages', label: 'Messages', icon: 'messages' },
  ],

  depot_manager: [
    { id: 'command', label: 'Depot Command Center', icon: 'dashboard' },
    { id: 'ops', label: 'Operations Supervisor', icon: 'assignment' },
    { id: 'dispatch', label: 'Dispatch / Trip Coordination', icon: 'route' },
    { id: 'fleet', label: 'Fleet & Maintenance', icon: 'maintenance' },
    { id: 'inventory', label: 'Inventory & Warehouse', icon: 'inventory' },
    { id: 'staff', label: 'Staff & Shifts', icon: 'schedule' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ],

  maintenance_manager: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'staff', label: 'Staff & RBAC', icon: 'users' },
    { id: 'tasks', label: 'Tasks & Workflow', icon: 'assignment' },
    { id: 'health', label: 'Fleet Health', icon: 'maintenance' },
    { id: 'inventory', label: 'Inventory & Parts', icon: 'inventory' },
    { id: 'incidents', label: 'Incidents & QC', icon: 'incidents' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ],

  finance_manager: [
    { id: 'revenue', label: 'Revenue', icon: 'revenue' },
    { id: 'transactions', label: 'Transactions', icon: 'payments' },
    { id: 'refunds', label: 'Refunds', icon: 'cancel' },
    { id: 'expenses', label: 'Expenses', icon: 'money' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ],

  hr_manager: [
    { id: 'profiles', label: 'Profiles', icon: 'users' },
    { id: 'attendance', label: 'Attendance', icon: 'schedule' },
    { id: 'payroll', label: 'Payroll', icon: 'revenue' },
    { id: 'training', label: 'Training', icon: 'safety' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ],
};

export default { iconMap, Icon, roleNavigation };
