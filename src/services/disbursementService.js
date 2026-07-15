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

export function listenToDisbursements(onChange, onError) {
  try {
    const ref = collection(db, "disbursements");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Disbursements listener:", err); onError(err); }
    );
  } catch (err) {
    console.error("listenToDisbursements init:", err);
    onChange([]);
    return () => {};
  }
}

export function createDisbursement(data) {
  return addDoc(collection(db, "disbursements"), {
    status: "pending",  // default status
    ...data,            // form data (including status if set) overrides the default
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateDisbursement(id, data) {
  return updateDoc(doc(db, "disbursements", id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteDisbursement(id) {
  return deleteDoc(doc(db, "disbursements", id));
}
