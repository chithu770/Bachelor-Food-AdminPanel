import {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "../firebase/firestore";

const ordersRef = collection(db, "orders");

/**
 * Two-stage read strategy:
 *
 * Stage 1  getDocs  – one-shot fetch of all existing order docs.
 *              Guarantees every stored document is made available to the UI
 *              immediately, even if the realtime listener is slow or dies
 *              due to a transient Firestore error.
 *
 * Stage 2  onSnapshot  – realtime subscription; fires every time any order
 *              doc is created, updated, or deleted.  Replaces whatever Stage 1
 *              emitted so the UI is always in sync.
 *
 * onError is called at most once: for any error that occurs during Stage 1
 * or Stage 2 initial setup.  After the first successful snapshot arrives all
 * prior errors are cleared automatically.
 */
export function listenToOrders(onChange, onError) {
  let errorCalled = false;

  /** Surface the first error *and* feed whatever data we have (may be []). */
  function report(err) {
    if (!errorCalled) {
      errorCalled = true;
      onError?.(err);
    }
  }

  // ── Stage 1 — one-shot fetch ───────────────────────────────────────────────
  getDocs(query(ordersRef, orderBy("createdAt", "desc")))
    .then((snap) => {
      if (snap.empty) return;            // collection genuinely empty – nothing to do
      try {
        onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      } catch (e) {
        console.error("Orders stage-1 mapping error:", e);
      }
    })
    .catch((err) => {
      console.error("Orders stage-1 (getDocs) error:", err);
      report(err);
    });

  // ── Stage 2 — realtime listener ───────────────────────────────────────────
  return onSnapshot(
    query(ordersRef, orderBy("createdAt", "desc")),
    (snap) => {
      try {
        onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      } catch (e) {
        console.error("Orders stage-2 mapping error:", e);
        onChange([]);
      }
    },
    (err) => {
      console.error("Orders stage-2 (onSnapshot) error:", err);
      report(err);
    }
  );
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export function createOrder(order) {
  return addDoc(ordersRef, {
    ...order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function updateOrder(id, order) {
  return updateDoc(doc(db, "orders", id), {
    ...order,
    updatedAt: serverTimestamp()
  });
}

export function deleteOrder(id) {
  return deleteDoc(doc(db, "orders", id));
}
