import {
  collection,
  db,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "../firebase/firestore";

// ── Food Reviews ──────────────────────────────────────────────────────────────
export function listenToFoodReviews(onChange, onError) {
  try {
    const ref = collection(db, "food_reviews");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Food reviews listener:", err); onError(err); }
    );
  } catch (err) {
    console.error("listenToFoodReviews init:", err);
    onChange([]);
    return () => {};
  }
}

export function updateFoodReview(id, data) {
  return updateDoc(doc(db, "food_reviews", id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteFoodReview(id) {
  return deleteDoc(doc(db, "food_reviews", id));
}

// ── Restaurant Reviews ────────────────────────────────────────────────────────
export function listenToRestaurantReviews(onChange, onError) {
  try {
    const ref = collection(db, "restaurant_reviews");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Restaurant reviews listener:", err); onError(err); }
    );
  } catch (err) {
    console.error("listenToRestaurantReviews init:", err);
    onChange([]);
    return () => {};
  }
}

export function updateRestaurantReview(id, data) {
  return updateDoc(doc(db, "restaurant_reviews", id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteRestaurantReview(id) {
  return deleteDoc(doc(db, "restaurant_reviews", id));
}

// ── Deliveryman Reviews ───────────────────────────────────────────────────────
export function listenToDeliverymanReviews(onChange, onError) {
  try {
    const ref = collection(db, "deliveryman_reviews");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Deliveryman reviews listener:", err); onError(err); }
    );
  } catch (err) {
    console.error("listenToDeliverymanReviews init:", err);
    onChange([]);
    return () => {};
  }
}

export function updateDeliverymanReview(id, data) {
  return updateDoc(doc(db, "deliveryman_reviews", id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteDeliverymanReview(id) {
  return deleteDoc(doc(db, "deliveryman_reviews", id));
}
