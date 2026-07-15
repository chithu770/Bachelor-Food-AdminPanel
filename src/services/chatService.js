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

export function listenToChats(onChange, onError) {
  try {
    const ref = collection(db, "chattings");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Chats listener:", err); onError(err); }
    );
  } catch (err) {
    console.error("listenToChats init:", err);
    onChange([]);
    return () => {};
  }
}

export function updateChatStatus(id, status) {
  return updateDoc(doc(db, "chattings", id), { status, updatedAt: serverTimestamp() });
}

export function deleteChat(id) {
  return deleteDoc(doc(db, "chattings", id));
}
