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
  updateDoc
} from "../firebase/firestore";

const zonesRef = collection(db, "zones");

export function listenToZones(onChange, onError) {
  try {
    return onSnapshot(
      query(zonesRef, orderBy("name", "asc")),
      (snapshot) => {
        try {
          const items = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }));
          items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          onChange(items);
        } catch (err) {
          console.error("Error mapping zones:", err);
          onChange([]);
        }
      },
      (error) => {
        console.error("Zones listener error:", error);
        onError(error);
      }
    );
  } catch (err) {
    console.error("listenToZones init error:", err);
    onChange([]);
    return () => {};
  }
}

export function createZone(data) {
  return addDoc(zonesRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function updateZone(id, data) {
  return updateDoc(doc(db, "zones", id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export function deleteZone(id) {
  return deleteDoc(doc(db, "zones", id));
}
