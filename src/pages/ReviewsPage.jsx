import { Star, Search, Trash2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Toast from "../components/common/Toast";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  listenToFoodReviews,
  listenToRestaurantReviews,
  listenToDeliverymanReviews,
  deleteFoodReview,
  deleteRestaurantReview,
  deleteDeliverymanReview,
  updateFoodReview,
  updateRestaurantReview,
  updateDeliverymanReview,
} from "../services/reviewService";
import { getFirebaseErrorMessage } from "../utils/helpers";

function StarRating({ value = 0 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
        />
      ))}
    </span>
  );
}

function ReviewTable({ reviews, loading, onDelete, onToggleStatus, type }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return reviews.filter(
      (r) =>
        (r.reviewerName || "").toLowerCase().includes(kw) ||
        (r.targetName || "").toLowerCase().includes(kw) ||
        (r.comment || "").toLowerCase().includes(kw)
    );
  }, [reviews, query]);

  return (
    <div className="panel space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-slate-950 capitalize">{type} Reviews</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9 sm:max-w-xs text-sm"
            placeholder="Search reviews..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-[200px] place-items-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
        </div>
      ) : !filtered.length ? (
        <div className="empty-state">No {type} reviews found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
              <tr>
                <th className="p-3 font-semibold">Reviewer</th>
                <th className="p-3 font-semibold capitalize">{type} Name</th>
                <th className="p-3 font-semibold">Rating</th>
                <th className="p-3 font-semibold">Comment</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((review) => (
                <tr key={review.id} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="font-medium text-slate-900">{review.reviewerName || "Anonymous"}</div>
                    <div className="text-xs text-slate-400">{review.reviewerEmail || ""}</div>
                  </td>
                  <td className="p-3 font-medium text-slate-900">{review.targetName || "—"}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <StarRating value={review.rating} />
                      <span className="text-xs text-slate-500">{review.rating}/5</span>
                    </div>
                  </td>
                  <td className="p-3 max-w-[200px]">
                    <p className="line-clamp-2 text-slate-600">{review.comment || "—"}</p>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        review.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {review.status || "active"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        title={review.status === "active" ? "Deactivate" : "Activate"}
                        className="p-1.5 rounded text-slate-600 hover:bg-slate-100"
                        onClick={() => onToggleStatus(review)}
                      >
                        {review.status === "active" ? (
                          <ThumbsDown className="h-4 w-4 text-amber-500" />
                        ) : (
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                        )}
                      </button>
                      <button
                        title="Delete"
                        className="p-1.5 rounded text-red-500 hover:bg-red-50"
                        onClick={() => onDelete(review)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState("food");
  const [foodReviews, setFoodReviews] = useState([]);
  const [restaurantReviews, setRestaurantReviews] = useState([]);
  const [deliverymanReviews, setDeliverymanReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubs = [
      listenToFoodReviews((data) => { setFoodReviews(data); setLoading(false); }, (e) => { console.error(e); setLoading(false); }),
      listenToRestaurantReviews((data) => setRestaurantReviews(data), (e) => console.error(e)),
      listenToDeliverymanReviews((data) => setDeliverymanReviews(data), (e) => console.error(e)),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, []);

  const currentReviews =
    activeTab === "food" ? foodReviews : activeTab === "restaurant" ? restaurantReviews : deliverymanReviews;

  async function handleToggleStatus(review) {
    try {
      const newStatus = review.status === "active" ? "inactive" : "active";
      const updateFn =
        activeTab === "food"
          ? updateFoodReview
          : activeTab === "restaurant"
          ? updateRestaurantReview
          : updateDeliverymanReview;
      await updateFn(review.id, { status: newStatus });
      setToast({ type: "success", message: `Review ${newStatus === "active" ? "activated" : "deactivated"}` });
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function handleDelete() {
    if (!deletingReview) return;
    try {
      const deleteFn =
        activeTab === "food"
          ? deleteFoodReview
          : activeTab === "restaurant"
          ? deleteRestaurantReview
          : deleteDeliverymanReview;
      await deleteFn(deletingReview.id);
      setToast({ type: "success", message: "Review deleted" });
      setDeletingReview(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  const tabs = [
    { key: "food", label: "Food Reviews", count: foodReviews.length },
    { key: "restaurant", label: "Restaurant Reviews", count: restaurantReviews.length },
    { key: "deliveryman", label: "Deliveryman Reviews", count: deliverymanReviews.length },
  ];

  const avgRating = (arr) => arr.length ? (arr.reduce((s, r) => s + (r.rating || 0), 0) / arr.length).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="page-header">
        <p className="eyebrow">Feedback Management</p>
        <h1 className="page-title">Reviews</h1>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <Star className="h-5 w-5 text-ember" />
          <span>Food Reviews</span>
          <strong>{foodReviews.length}</strong>
          <span className="text-xs text-slate-400">Avg: {avgRating(foodReviews)} ★</span>
        </div>
        <div className="metric">
          <Star className="h-5 w-5 text-amber-500" />
          <span>Restaurant Reviews</span>
          <strong>{restaurantReviews.length}</strong>
          <span className="text-xs text-slate-400">Avg: {avgRating(restaurantReviews)} ★</span>
        </div>
        <div className="metric">
          <Star className="h-5 w-5 text-blue-500" />
          <span>Deliveryman Reviews</span>
          <strong>{deliverymanReviews.length}</strong>
          <span className="text-xs text-slate-400">Avg: {avgRating(deliverymanReviews)} ★</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-ember text-ember"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{tab.count}</span>
          </button>
        ))}
      </div>

      <ReviewTable
        reviews={currentReviews}
        loading={loading}
        onDelete={(review) => setDeletingReview(review)}
        onToggleStatus={handleToggleStatus}
        type={activeTab}
      />

      <ConfirmDialog
        confirmLabel="Delete Review"
        message="Are you sure you want to delete this review? This cannot be undone."
        onCancel={() => setDeletingReview(null)}
        onConfirm={handleDelete}
        open={Boolean(deletingReview)}
        title="Delete Review"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
