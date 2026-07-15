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

const cuisinesRef = collection(db, "cuisines");

export function listenToCuisines(onChange, onError) {
  try {
    return onSnapshot(
      query(cuisinesRef, orderBy("name", "asc")),
      (snapshot) => {
        try {
          const items = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }));
          items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          onChange(items);
        } catch (err) {
          console.error("Error mapping cuisines:", err);
          onChange([]);
        }
      },
      (error) => {
        console.error("Cuisines listener error:", error);
        onError(error);
      }
    );
  } catch (err) {
    console.error("listenToCuisines init error:", err);
    onChange([]);
    return () => {};
  }
}

export function createCuisine(data) {
  return addDoc(cuisinesRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function updateCuisine(id, data) {
  return updateDoc(doc(db, "cuisines", id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export function deleteCuisine(id) {
  return deleteDoc(doc(db, "cuisines", id));
}
