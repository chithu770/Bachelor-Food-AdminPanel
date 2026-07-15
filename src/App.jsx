import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/admin/AdminLayout";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import CartPage from "./components/cart/CartPage";
import HotelsPage from "./components/hotels/HotelsPage";
import ProductsPage from "./components/products/ProductsPage";
import UsersPage from "./components/users/UsersPage";
import PrivateRoute from "./components/common/PrivateRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { useAuth } from "./hooks/useAuth";
import { ROUTES } from "./routes";
import CampaignsPage from "./pages/CampaignsPage";
import CouponsPage from "./pages/CouponsPage";
import CuisinesPage from "./pages/CuisinesPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerProfilePage from "./pages/CustomerProfilePage";
import FoodCategoriesPage from "./pages/FoodCategoriesPage";
import OrdersPage from "./pages/OrdersPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import SubscriptionOrdersPage from "./pages/SubscriptionOrdersPage";
import DeliveryPartnersPage from "./pages/DeliveryPartnersPage";
import VehiclesPage from "./pages/VehiclesPage";
import ShiftsPage from "./pages/ShiftsPage";
import EmployeesPage from "./pages/EmployeesPage";
import BusinessSettingsPage from "./pages/BusinessSettingsPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";
import POSPage from "./pages/POSPage";
import DispatchManagementPage from "./pages/DispatchManagementPage";
import RefundsPage from "./pages/RefundsPage";
import AddonsPage from "./pages/AddonsPage";
import ZonesPage from "./pages/ZonesPage";
import BannersPage from "./pages/BannersPage";
import CashbackPage from "./pages/CashbackPage";
import PushNotificationsPage from "./pages/PushNotificationsPage";
import LiveChatPage from "./pages/LiveChatPage";
import ContactMessagesPage from "./pages/ContactMessagesPage";
import WalletPage from "./pages/WalletPage";
import LoyaltyPointsPage from "./pages/LoyaltyPointsPage";
import DisbursementPage from "./pages/DisbursementPage";
import ReportsPage from "./pages/ReportsPage";
import TransactionsPage from "./pages/TransactionsPage";
import MailSubscriptionsPage from "./pages/MailSubscriptionsPage";
import DashboardPage from "./pages/DashboardPage";
import ReviewsPage from "./pages/ReviewsPage";
import RestaurantWithdrawsPage from "./pages/RestaurantWithdrawsPage";
import DeliverymanPaymentsPage from "./pages/DeliverymanPaymentsPage";
import WithdrawMethodPage from "./pages/WithdrawMethodPage";
import DeliverymanBonusPage from "./pages/DeliverymanBonusPage";
import DeliverymanIncentivePage from "./pages/DeliverymanIncentivePage";
import DeliverymanNewUserPage from "./pages/DeliverymanNewUserPage";

function PlaceholderPage({ title }) {
  return (
    <div className="panel empty-state">
      <p className="text-lg font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">
        This module is coming soon. Configure it via{" "}
        <strong>Business Settings</strong> or <strong>System Settings</strong>.
      </p>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingSpinner label="Starting Bachelor Foods" />;

  return (
    <Routes>
      <Route element={<Login />} path={ROUTES.login} />
      <Route element={<Register />} path={ROUTES.register} />

      {/* ── Protected routes ────────────────────────────────────────────────── */}
      <Route element={<PrivateRoute />}>
        <Route element={<AdminLayout />}>

          {/* Core */}
          <Route element={<DashboardPage />} index />
          <Route element={<MyOrdersPage />} path="my-orders" />
          <Route element={<POSPage />} path="pos" />
          <Route element={<CartPage />} path="cart" />

          {/* Order management */}
          <Route element={<OrdersPage />} path="orders" />
          <Route element={<SubscriptionOrdersPage />} path="subscription-orders" />
          <Route element={<DispatchManagementPage />} path="dispatch-management" />
          <Route element={<RefundsPage />} path="order-refunds" />
          <Route element={<PlaceholderPage title="Offline Payments" />} path="order-offline-payments" />

          {/* Restaurant management */}
          <Route element={<ZonesPage />} path="zone-setup" />
          <Route element={<CuisinesPage />} path="cuisines" />
          <Route element={<HotelsPage />} path="restaurants" />
          <Route element={<HotelsPage />} path="restaurants/pending" />
          <Route element={<PlaceholderPage title="Bulk Import Restaurants" />} path="restaurants/bulk-import" />
          <Route element={<PlaceholderPage title="Bulk Export Restaurants" />} path="restaurants/bulk-export" />

          {/* Food management */}
          <Route element={<FoodCategoriesPage />} path="food-categories" />
          <Route element={<PlaceholderPage title="Sub Categories" />} path="food-sub-categories" />
          <Route element={<AddonsPage />} path="food-addons" />
          <Route element={<ProductsPage />} path="foods" />
          <Route element={<ReviewsPage />} path="foods/reviews" />

          {/* Reviews */}
          <Route element={<ReviewsPage />} path="reviews" />
          <Route element={<ReviewsPage />} path="deliverymen/reviews" />

          {/* Promotions management */}
          <Route element={<CampaignsPage />} path="campaigns" />
          <Route element={<CouponsPage />} path="coupons" />
          <Route element={<CashbackPage />} path="cashback" />
          <Route element={<BannersPage />} path="banners" />
          <Route element={<BannersPage />} path="promotional-banner" />
          <Route element={<PlaceholderPage title="Advertisement" />} path="advertisement/create" />
          <Route element={<PlaceholderPage title="Ad Requests" />} path="advertisement/requests" />
          <Route element={<PlaceholderPage title="Ads List" />} path="advertisement/list" />

          {/* Push notification */}
          <Route element={<PushNotificationsPage />} path="push-notification" />

          {/* Help & Support */}
          <Route element={<LiveChatPage />} path="chattings" />
          <Route element={<ContactMessagesPage />} path="contact-messages" />

          {/* Customer management */}
          <Route element={<CustomersPage />} path="customers" />
          <Route element={<CustomerProfilePage />} path="customer-profile/:customerId" />
          <Route element={<WalletPage />} path="wallet" />
          <Route element={<WalletPage />} path="wallet/add-fund" />
          <Route element={<WalletPage />} path="wallet/bonus" />
          <Route element={<LoyaltyPointsPage />} path="loyalty-points" />
          <Route element={<LoyaltyPointsPage />} path="loyalty-points/report" />
          <Route element={<MailSubscriptionsPage />} path="subscribed-mail-list" />

          {/* Delivery partner management */}
          <Route element={<VehiclesPage />} path="vehicles" />
          <Route element={<ShiftsPage />} path="shifts" />
          <Route element={<DeliveryPartnersPage />} path="deliverymen" />
          <Route element={<DeliveryPartnersPage />} path="deliverymen/pending" />
          <Route element={<DeliveryPartnersPage />} path="deliverymen/add" />
          <Route element={<DeliverymanBonusPage />} path="deliverymen/bonus" />
          <Route element={<DeliverymanIncentivePage />} path="deliverymen/incentive" />
          <Route element={<DeliverymanIncentivePage />} path="deliverymen/incentive-history" />
          <Route element={<DeliverymanNewUserPage />} path="deliverymen/new-user" />

          {/* Disbursement management */}
          <Route element={<DisbursementPage />} path="disbursement" />
          <Route element={<DisbursementPage />} path="disbursement/restaurant" />
          <Route element={<DisbursementPage />} path="disbursement/delivery-man" />

          {/* Report management */}
          <Route element={<ReportsPage />} path="reports" />
          <Route element={<ReportsPage />} path="reports/transactions" />
          <Route element={<ReportsPage />} path="reports/expense" />
          <Route element={<ReportsPage />} path="reports/disbursement" />
          <Route element={<ReportsPage />} path="reports/food" />
          <Route element={<ReportsPage />} path="reports/order-report" />
          <Route element={<ReportsPage />} path="reports/campaign-order-report" />
          <Route element={<ReportsPage />} path="reports/restaurant-report" />
          <Route element={<ReportsPage />} path="reports/subscription-report" />
          <Route element={<ReportsPage />} path="reports/customer-wallet" />

          {/* Transaction management */}
          <Route element={<TransactionsPage />} path="transactions" />
          <Route element={<RestaurantWithdrawsPage />} path="restaurant-withdraws" />
          <Route element={<DeliverymanPaymentsPage />} path="deliveryman-payments" />
          <Route element={<WithdrawMethodPage />} path="withdraw-method" />

          {/* Staff management */}
          <Route element={<EmployeesPage />} path="employees" />
          <Route element={<EmployeesPage />} path="employees/add" />
          <Route element={<EmployeesPage />} path="employee-role" />

          {/* Subscription */}
          <Route element={<PlaceholderPage title="Subscription Packages" />} path="subscription/packages" />
          <Route element={<PlaceholderPage title="Subscriber List" />} path="subscription/subscribers" />
          <Route element={<PlaceholderPage title="Subscription Settings" />} path="subscription/settings" />
          <Route element={<PlaceholderPage title="Meal Subscription" />} path="meal-subscription" />

          {/* Business settings */}
          <Route element={<BusinessSettingsPage />} path="business-settings" />
          <Route element={<BusinessSettingsPage />} path="business-settings/email" />
          <Route element={<BusinessSettingsPage />} path="business-settings/theme" />
          <Route element={<BusinessSettingsPage />} path="business-settings/login" />
          <Route element={<BusinessSettingsPage />} path="business-settings/social-media" />
          <Route element={<BusinessSettingsPage />} path="business-settings/terms" />
          <Route element={<BusinessSettingsPage />} path="business-settings/privacy" />
          <Route element={<BusinessSettingsPage />} path="business-settings/about" />
          <Route element={<BusinessSettingsPage />} path="business-settings/refund" />
          <Route element={<BusinessSettingsPage />} path="business-settings/shipping" />
          <Route element={<BusinessSettingsPage />} path="business-settings/cancellation" />
          <Route element={<BusinessSettingsPage />} path="business-settings/3rd-party" />
          <Route element={<BusinessSettingsPage />} path="business-settings/fcm" />
          <Route element={<BusinessSettingsPage />} path="business-settings/offline" />
          <Route element={<BusinessSettingsPage />} path="business-settings/join-us" />
          <Route element={<BusinessSettingsPage />} path="business-settings/app-web" />
          <Route element={<BusinessSettingsPage />} path="business-settings/notifications" />
          <Route element={<BusinessSettingsPage />} path="business-settings/landing-page" />
          <Route element={<BusinessSettingsPage />} path="business-settings/react-landing" />
          <Route element={<BusinessSettingsPage />} path="business-settings/react-site" />
          <Route element={<BusinessSettingsPage />} path="business-settings/database" />
          <Route element={<PlaceholderPage title="Gallery" />} path="gallery" />
          <Route element={<PlaceholderPage title="System Addons" />} path="system-addons" />

          {/* System settings */}
          <Route element={<SystemSettingsPage />} path="system-settings" />

          {/* Legacy routes kept for backward compatibility */}
          <Route element={<PlaceholderPage title="Users" />} path="users" />
          <Route element={<ProductsPage />} path="products" />
          <Route element={<HotelsPage />} path="hotels" />
          <Route element={<UsersPage />} path="users-legacy" />
        </Route>
      </Route>

      <Route element={<Navigate replace to={ROUTES.dashboard} />} path="*" />
    </Routes>
  );
}
