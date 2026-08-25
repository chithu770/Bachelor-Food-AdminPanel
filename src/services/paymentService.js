
import { collection, db, onSnapshot, orderBy, query } from "../firebase/firestore";

export function listenToPayments(onChange, onError) {
  try {
    const ref = collection(db, "payments");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Payments listener:", err); onError(err); }
    );
  } catch (err) {
    onChange([]);
    return () => {};
  }
}
