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

export function listenToLoyaltyPoints(onChange, onError) {
  try {
    const ref = collection(db, "loyalty_points");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Loyalty listener:", err); onError(err); }
    );
  } catch (err) {
    console.error("listenToLoyaltyPoints init:", err);
    onChange([]);
    return () => {};
  }
}

export function createLoyaltyEntry(data) {
  return addDoc(collection(db, "loyalty_points"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export function updateLoyaltyEntry(id, data) {
  return updateDoc(doc(db, "loyalty_points", id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteLoyaltyEntry(id) {
  return deleteDoc(doc(db, "loyalty_points", id));
}
