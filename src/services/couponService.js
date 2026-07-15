import {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "../firebase/firestore";

const couponsRef = collection(db, "coupons");

export function listenToCoupons(onChange, onError) {
  try {
    const q = query(couponsRef, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
          onChange(items);
        } catch (err) {
          console.error("Error mapping coupons:", err);
          onChange([]);
        }
      },
      (error) => {
        console.error("Coupons listener error:", error);
        onError(error);
      }
    );
  } catch (err) {
    console.error("listenToCoupons init error:", err);
    onChange([]);
    return () => {};
  }
}

export function createCoupon(coupon) {
  return addDoc(couponsRef, {
    ...coupon,
    code: coupon.code.toUpperCase(),
    usedCount: coupon.usedCount || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function updateCoupon(id, coupon) {
  const updates = { ...coupon, updatedAt: serverTimestamp() };
  // Only uppercase code if it's present in the update payload
  if (updates.code) updates.code = updates.code.toUpperCase();
  return updateDoc(doc(db, "coupons", id), updates);
}

export function deleteCoupon(id) {
  return deleteDoc(doc(db, "coupons", id));
}
