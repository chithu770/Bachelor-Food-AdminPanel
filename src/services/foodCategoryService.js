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

const categoriesRef = collection(db, "categories");

export function listenToFoodCategories(onChange, onError) {
  try {
    return onSnapshot(
      query(categoriesRef, orderBy("name", "asc")),
      (snapshot) => {
        try {
          const items = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }));
          items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          onChange(items);
        } catch (err) {
          console.error("Error mapping food categories:", err);
          onChange([]);
        }
      },
      (error) => {
        console.error("Food categories listener error:", error);
        onError(error);
      }
    );
  } catch (err) {
    console.error("listenToFoodCategories init error:", err);
    onChange([]);
    return () => {};
  }
}

export function createFoodCategory(data) {
  return addDoc(categoriesRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function updateFoodCategory(id, data) {
  return updateDoc(doc(db, "categories", id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export function deleteFoodCategory(id) {
  return deleteDoc(doc(db, "categories", id));
}
