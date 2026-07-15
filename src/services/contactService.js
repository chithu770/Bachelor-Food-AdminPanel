import {
  collection,
  db,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from "../firebase/firestore";

export function listenToContactMessages(onChange, onError) {
  try {
    const ref = collection(db, "contact_messages");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Contact messages listener:", err); onError(err); }
    );
  } catch (err) {
    console.error("listenToContactMessages init:", err);
    onChange([]);
    return () => {};
  }
}

export function updateContactMessageStatus(id, status) {
  return updateDoc(doc(db, "contact_messages", id), { status, updatedAt: serverTimestamp() });
}

export function deleteContactMessage(id) {
  return deleteDoc(doc(db, "contact_messages", id));
}
