/**
 * Menu configuration for the admin sidebar.
 *
 * Each item supports:
 * - label: display text
 * - to: route path
 * - icon: lucide-react icon component
 * - badge: optional badge config { value, color }
 * - children: nested sub-items (same shape)
 * - roles: optional array of allowed roles ('super_admin', 'admin', 'manager', 'staff')
 * - permission: optional permission key checked against user permissions
 * - hidden: optional boolean to force hide
 * - section: optional section header label for grouping
 */

import {
  LayoutDashboard,
  Receipt,
  FileText,
  Calendar,
  Truck,
  HandCoins,
  ArrowUpRightFromSquare,
  ArrowDownToLine,
  MapPin,
  Globe,
  Store,
  FolderOpen,
  ShoppingBag,
  UtensilsCrossed,
  ListPlus,
  Zap,
  Ticket,
  DollarSign,
  Bell,
  Newspaper,
  Tv,
  MessageSquare,
  MessagesSquare,
  Users,
  Wifi,
  CreditCard,
  Link2,
  Settings,
  Gift,
  Medal,
  Mail,
  School,
  Car,
  Bike,
  ShieldCheck,
  Puzzle,
  Crown,
  Bookmark,
  HelpCircle,
  ClipboardList,
  Scale,
  Rocket,
  Trash2,
  ChartPie,
  PieChart,
  RotateCcw,
  Search,
  Smartphone,
  Clock,
  ClipboardList as Pages,
  Image,
  Target,
  ChevronDown,
  UserCheck,
  UserPlus,
  Star,
  RefreshCw,
  BarChart3,
  Wallet as WalletIcon,
  Send,
  PiggyBank,
  Palette,
  Image as Gallery,
  LogIn,
  Building2,
  Server,
  Puzzle as AddonIcon
} from "lucide-react";

export const USER_ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff"
});

export const ROLE_HIERARCHY = Object.freeze({
  [USER_ROLES.SUPER_ADMIN]: 4,
  [USER_ROLES.ADMIN]: 3,
  [USER_ROLES.MANAGER]: 2,
  [USER_ROLES.STAFF]: 1
});

export function hasRole(userRole, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  return allowedRoles.some((role) => (ROLE_HIERARCHY[role] ?? 0) <= userLevel);
}

export function hasPermission(userPermissions = [], requiredPermission) {
  if (!requiredPermission) return true;
  return userPermissions.includes(requiredPermission);
}

export function filterMenu(items, userRole, userPermissions = []) {
  return items
    .filter((item) => {
      if (item.hidden) return false;
      if (!hasRole(userRole, item.roles)) return false;
      if (!hasPermission(userPermissions, item.permission)) return false;
      return true;
    })
    .map((item) => {
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: filterMenu(item.children, userRole, userPermissions)
        };
      }
      return item;
    });
}

export const MENU_ITEMS = Object.freeze([
  { section: "DASHBOARD" },
  { label: "Dashboard", to: "/", icon: LayoutDashboard, exact: true, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF] },
  
  { section: "ORDER MANAGEMENT" },
  { label: "Subscriptions", to: "/subscription-orders", icon: Calendar, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF] },
  { label: "Orders", icon: FileText, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF], children: [
      { label: "All", to: "/orders", icon: FileText },
      { label: "Pending", to: "/orders?status=pending", icon: FileText },
      { label: "Accepted", to: "/orders?status=confirmed", icon: FileText },
      { label: "Processing", to: "/orders?status=preparing", icon: FileText },
      { label: "Food On The Way", to: "/orders?status=out_for_delivery", icon: Truck },
      { label: "Delivered", to: "/orders?status=delivered", icon: FileText },
      { label: "Canceled", to: "/orders?status=cancelled", icon: FileText },
      { label: "Scheduled", to: "/orders?status=scheduled", icon: Calendar },
      { label: "Payment Failed", to: "/orders?status=failed", icon: CreditCard },
      { label: "Refunded", to: "/orders?status=refunded", icon: RotateCcw },
      { label: "Dine In", to: "/orders?status=dine_in", icon: UtensilsCrossed },
    ]
  },
  { label: "Dispatch Management", icon: Truck, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF], children: [
      { label: "Searching for Deliveryman", to: "/dispatch-management?searching", icon: Search, badge: { value: 0, color: "bg-orange-100 text-orange-700" } },
      { label: "Ongoing Orders", to: "/dispatch-management?ongoing", icon: Truck, badge: { value: 0, color: "bg-emerald-100 text-emerald-700" } }
    ]
  },

  { section: "DELIVERY MAN MANAGEMENT" },
  { label: "Vehicles Setup", to: "/vehicles", icon: Car, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER] },
  { label: "Shift Setup", to: "/shifts", icon: Calendar, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER] },
  { label: "Delivery Man", icon: Bike, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER], children: [
      { label: "New Join Request", to: "/deliverymen/pending", icon: UserCheck, badge: { value: 0, color: "bg-cyan-100 text-cyan-700" } },
      { label: "Add New", to: "/deliverymen/add", icon: UserPlus },
      { label: "List", to: "/deliverymen", icon: Bike },
      { label: "New User", to: "/deliverymen/new-user", icon: Users },
      { label: "Reviews", to: "/deliverymen/reviews", icon: Star },
      { label: "Bonus & Incentives", to: "/deliverymen/bonus", icon: Gift },
    ]
  },

  { section: "RESTAURANT & FOOD" },
  { label: "Restaurants", to: "/restaurants", icon: Store, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER] },
  { label: "Categories", to: "/food-categories", icon: FolderOpen, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF] },
  { label: "Cuisines", to: "/cuisines", icon: UtensilsCrossed, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF] },
  { label: "Foods", to: "/foods", icon: UtensilsCrossed, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF] },

  { section: "USERS & SUPPORT" },
  { label: "Customers", to: "/customers", icon: Users, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF] },
  { label: "Chattings", to: "/chattings", icon: MessageSquare, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF] },
  { label: "Contact Messages", to: "/contact-messages", icon: MessagesSquare, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF], badge: { value: 0, color: "bg-indigo-100 text-indigo-700" } },
  { label: "Employees", to: "/employees", icon: Users, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER] },

  { section: "FINANCE & REPORTS" },
  { label: "Disbursement", icon: Server, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER], children: [
      { label: "Restaurant Disbursement", to: "/disbursement/restaurant", icon: WalletIcon, badge: { value: 0, color: "bg-emerald-100 text-emerald-700" } },
      { label: "Delivery Man Disbursement", to: "/disbursement/delivery-man", icon: WalletIcon, badge: { value: 0, color: "bg-teal-100 text-teal-700" } }
    ]
  },
  { label: "Transactions", to: "/transactions", icon: DollarSign, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER] },
  { label: "Reports", to: "/reports/transactions", icon: ChartPie, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF] },

  { section: "SYSTEM SETTINGS" },
  { label: "Business Setup", to: "/business-settings", icon: Settings, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN] },
  { label: "App & Web Settings", to: "/business-settings/app-web", icon: Smartphone, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN] },
  { label: "Push Notification", to: "/push-notification", icon: Bell, roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MANAGER] }
]);

export default MENU_ITEMS;
