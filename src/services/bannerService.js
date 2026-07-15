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

export function listenToBanners(onChange, onError) {
  try {
    const ref = collection(db, "banners");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => onChange(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Banners listener:", err); onError(err); }
    );
  } catch (err) {
    console.error("listenToBanners init:", err);
    onChange([]);
    return () => {};
  }
}

export function createBanner(data) {
  return addDoc(collection(db, "banners"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateBanner(id, data) {
  return updateDoc(doc(db, "banners", id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteBanner(id) {
  return deleteDoc(doc(db, "banners", id));
}
