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

export function listenToWalletTransactions(onChange, onError) {
  try {
    const ref = collection(db, "wallet_transactions");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Wallet listener:", err); onError(err); }
    );
  } catch (err) {
    console.error("listenToWalletTransactions init:", err);
    onChange([]);
    return () => {};
  }
}

export function createWalletTransaction(data) {
  return addDoc(collection(db, "wallet_transactions"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export function deleteWalletTransaction(id) {
  return deleteDoc(doc(db, "wallet_transactions", id));
}
