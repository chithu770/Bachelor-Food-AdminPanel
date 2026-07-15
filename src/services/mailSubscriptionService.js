import {
  collection,
  db,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "../firebase/firestore";

export function listenToMailSubscriptions(onChange, onError) {
  // Track active unsubscribers so we can always clean up properly
  let innerUnsub = null;

  try {
    const ref = collection(db, "subscribed_mail_list");
    const q = query(ref, orderBy("subscribedAt", "desc"));

    const outerUnsub = onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => {
        // Primary query failed (e.g. missing index) — fall back to unordered query
        outerUnsub && outerUnsub();
        const q2 = query(collection(db, "subscribed_mail_list"));
        innerUnsub = onSnapshot(
          q2,
          (s) => onChange(s.docs.map((d) => ({ ...d.data(), id: d.id }))),
          (e) => { console.error("Mail sub fallback listener:", e); onError(e); }
        );
      }
    );

    // Return a cleanup function that stops whichever listener is currently active
    return () => {
      outerUnsub && outerUnsub();
      innerUnsub && innerUnsub();
    };
  } catch (err) {
    console.error("listenToMailSubscriptions init:", err);
    onChange([]);
    return () => {};
  }
}

export function deleteMailSubscription(id) {
  return deleteDoc(doc(db, "subscribed_mail_list", id));
}
