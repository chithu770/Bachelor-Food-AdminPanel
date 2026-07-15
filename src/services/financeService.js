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
  updateDoc,
} from "../firebase/firestore";

// ── Restaurant Withdrawals ────────────────────────────────────────────────────
export function listenToRestaurantWithdrawals(onChange, onError) {
  try {
    const ref = collection(db, "restaurant_withdrawals");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Restaurant withdrawals listener:", err); onError(err); }
    );
  } catch (err) {
    onChange([]);
    return () => {};
  }
}

export function updateRestaurantWithdrawal(id, data) {
  return updateDoc(doc(db, "restaurant_withdrawals", id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteRestaurantWithdrawal(id) {
  return deleteDoc(doc(db, "restaurant_withdrawals", id));
}

// ── Deliveryman Payments ───────────────────────────────────────────────────────
export function listenToDeliverymanPayments(onChange, onError) {
  try {
    const ref = collection(db, "deliveryman_payments");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Deliveryman payments listener:", err); onError(err); }
    );
  } catch (err) {
    onChange([]);
    return () => {};
  }
}

export function createDeliverymanPayment(data) {
  return addDoc(collection(db, "deliveryman_payments"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateDeliverymanPayment(id, data) {
  return updateDoc(doc(db, "deliveryman_payments", id), { ...data, updatedAt: serverTimestamp() });
}

// ── Withdraw Methods ───────────────────────────────────────────────────────────
export function listenToWithdrawMethods(onChange, onError) {
  try {
    const ref = collection(db, "withdraw_methods");
    return onSnapshot(
      ref,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Withdraw methods listener:", err); onError(err); }
    );
  } catch (err) {
    onChange([]);
    return () => {};
  }
}

export function createWithdrawMethod(data) {
  return addDoc(collection(db, "withdraw_methods"), {
    ...data,
    active: true,
    createdAt: serverTimestamp(),
  });
}

export function updateWithdrawMethod(id, data) {
  return updateDoc(doc(db, "withdraw_methods", id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteWithdrawMethod(id) {
  return deleteDoc(doc(db, "withdraw_methods", id));
}

// ── Deliveryman Bonus ──────────────────────────────────────────────────────────
export function listenToDeliverymanBonus(onChange, onError) {
  try {
    const ref = collection(db, "deliveryman_bonus");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Deliveryman bonus listener:", err); onError(err); }
    );
  } catch (err) {
    onChange([]);
    return () => {};
  }
}

export function createDeliverymanBonus(data) {
  return addDoc(collection(db, "deliveryman_bonus"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export function deleteDeliverymanBonus(id) {
  return deleteDoc(doc(db, "deliveryman_bonus", id));
}

// ── Deliveryman Incentives ─────────────────────────────────────────────────────
export function listenToIncentiveRules(onChange, onError) {
  try {
    const ref = collection(db, "incentive_rules");
    return onSnapshot(
      ref,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Incentive rules listener:", err); onError(err); }
    );
  } catch (err) {
    onChange([]);
    return () => {};
  }
}

export function createIncentiveRule(data) {
  return addDoc(collection(db, "incentive_rules"), {
    ...data,
    active: true,
    createdAt: serverTimestamp(),
  });
}

export function updateIncentiveRule(id, data) {
  return updateDoc(doc(db, "incentive_rules", id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteIncentiveRule(id) {
  return deleteDoc(doc(db, "incentive_rules", id));
}

export function listenToIncentiveHistory(onChange, onError) {
  try {
    const ref = collection(db, "incentive_history");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Incentive history listener:", err); onError(err); }
    );
  } catch (err) {
    onChange([]);
    return () => {};
  }
}
