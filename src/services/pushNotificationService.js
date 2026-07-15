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
} from "../firebase/firestore";

// Push Notification logs / history
export function listenToPushNotifications(onChange, onError) {
  try {
    const ref = collection(db, "push_notifications");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Push notifications listener:", err); onError(err); }
    );
  } catch (err) {
    console.error("listenToPushNotifications init:", err);
    onChange([]);
    return () => {};
  }
}

export function createPushNotification(data) {
  return addDoc(collection(db, "push_notifications"), {
    ...data,
    status: "sent",
    createdAt: serverTimestamp(),
  });
}

export function deletePushNotification(id) {
  return deleteDoc(doc(db, "push_notifications", id));
}
