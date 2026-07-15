export const PRODUCT_CATEGORIES = ["Breakfast", "Lunch", "Snacks/Bakery", "Dinner"];

export const HOTEL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Beverages", "Desserts"];

export const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80";

export const DEFAULT_HOTEL_IMAGE =
  "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=80";

export const DEFAULT_FOOD_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

export const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || "rC7fqyqk9XQnHXsosqx1iJqq1gx2";

export const USER_ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
});

export const ROLE_HIERARCHY = Object.freeze({
  [USER_ROLES.SUPER_ADMIN]: 4,
  [USER_ROLES.ADMIN]: 3,
  [USER_ROLES.MANAGER]: 2,
  [USER_ROLES.STAFF]: 1
});
