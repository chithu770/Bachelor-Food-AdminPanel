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

export function listenToCashbackOffers(onChange, onError) {
  try {
    const ref = collection(db, "cashback_offers");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Cashback listener:", err); onError(err); }
    );
  } catch (err) {
    console.error("listenToCashbackOffers init:", err);
    onChange([]);
    return () => {};
  }
}

export function createCashbackOffer(data) {
  return addDoc(collection(db, "cashback_offers"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateCashbackOffer(id, data) {
  return updateDoc(doc(db, "cashback_offers", id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteCashbackOffer(id) {
  return deleteDoc(doc(db, "cashback_offers", id));
}
