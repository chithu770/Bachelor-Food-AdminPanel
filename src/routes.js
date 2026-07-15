export const ROUTES = {
  // Auth
  login: "/login",
  register: "/register",

  // Core
  dashboard: "/",
  pos: "/pos",
  cart: "/cart",
  myOrders: "/my-orders",

  // Order management
  orders: "/orders",
  subscriptionOrders: "/subscription-orders",
  dispatchManagement: "/dispatch-management",
  orderRefunds: "/order-refunds",
  orderOfflinePayments: "/order-offline-payments",

  // Delivery management
  zones: "/zone-setup",
  cuisines: "/cuisines",
  restaurants: "/restaurants",
  restaurantPending: "/restaurants/pending",
  restaurantBulkImport: "/restaurants/bulk-import",
  restaurantBulkExport: "/restaurants/bulk-export",
  mealSubscription: "/meal-subscription",

  // Food management
  foodCategories: "/food-categories",
  foodAddons: "/food-addons",
  foods: "/foods",

  // Promotions management
  campaigns: "/campaigns",
  coupons: "/coupons",
  cashback: "/cashback",
  banners: "/banners",
  promotionalBanner: "/promotional-banner",

  // Advertisement
  advertisementCreate: "/advertisement/create",
  advertisementRequests: "/advertisement/requests",
  advertisementList: "/advertisement/list",

  // Push notification
  pushNotification: "/push-notification",

  // Help & Support
  chattings: "/chattings",
  contactMessages: "/contact-messages",

  // Customer management
  customerProfile: "/customer-profile/:customerId",
  customers: "/customers",
  wallet: "/wallet",
  walletAddFund: "/wallet/add-fund",
  walletBonus: "/wallet/bonus",
  loyaltyPoints: "/loyalty-points",
  loyaltyReport: "/loyalty-points/report",
  subscribedMailList: "/subscribed-mail-list",

  // Delivery partner management
  vehicles: "/vehicles",
  shifts: "/shifts",
  deliverymen: "/deliverymen",
  deliverymanPending: "/deliverymen/pending",
  deliverymanReviews: "/deliverymen/reviews",
  deliverymanBonus: "/deliverymen/bonus",
  deliverymanIncentive: "/deliverymen/incentive",
  deliverymanIncentiveHistory: "/deliverymen/incentive-history",
  deliverymanNewUser: "/deliverymen/new-user",

  // Disbursement management
  disbursement: "/disbursement",
  restaurantDisbursement: "/disbursement/restaurant",
  deliveryManDisbursement: "/disbursement/delivery-man",

  // Report management
  reports: "/reports",
  reportTransactions: "/reports/transactions",
  reportExpense: "/reports/expense",
  reportDisbursement: "/reports/disbursement",
  reportFood: "/reports/food",
  reportOrder: "/reports/orders",
  reportRestaurant: "/reports/restaurants",
  reportSubscription: "/reports/subscription",
  reportCustomer: "/reports/customers",

  // Transaction management
  transactions: "/transactions",
  restaurantWithdraws: "/restaurant-withdraws",
  deliveryManPayments: "/deliveryman-payments",
  withdrawMethod: "/withdraw-method",

  // Staff management
  employees: "/employees",
  addEmployee: "/employees/add",
  employeeRole: "/employee-role",

  // Business settings
  businessSettings: "/business-settings",
  subscriptionPackages: "/subscription/packages",
  subscriberList: "/subscription/subscribers",
  subscriptionSettings: "/subscription/settings",
  emailTemplate: "/business-settings/email",
  themeSettings: "/business-settings/theme",
  gallery: "/gallery",
  loginSetup: "/business-settings/login",
  pagesSocialMedia: "/business-settings/pages",
  termsAndConditions: "/business-settings/terms",
  privacyPolicy: "/business-settings/privacy",
  aboutUs: "/business-settings/about",
  refundPolicy: "/business-settings/refund",
  shippingPolicy: "/business-settings/shipping",
  cancellationPolicy: "/business-settings/cancellation",
  thirdPartyConfig: "/business-settings/3rd-party",
  firebaseNotification: "/business-settings/fcm",
  offlinePayment: "/business-settings/offline",
  joinUsPage: "/business-settings/join-us",
  appWebSettings: "/business-settings/app-web",
  notificationChannels: "/business-settings/notifications",
  adminLandingPage: "/business-settings/landing-page",
  reactLandingPage: "/business-settings/react-landing",
  reactSite: "/business-settings/react-site",
  cleanDatabase: "/business-settings/database",

  // System Addons
  systemAddons: "/system-addons"
};
