import {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc
} from "../firebase/firestore";

const productsRef = collection(db, "products");

export async function fetchAllProducts() {
  try {
    const snapshot = await getDocs(productsRef);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.error("Fetch products error:", error);
    throw error;
  }
}

export function listenToProducts(onChange, onError) {
  try {
    return onSnapshot(
      productsRef,
      (snapshot) => {
        try {
          const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
          items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          onChange(items);
        } catch (err) {
          console.error("Error mapping products:", err);
          onChange([]);
        }
      },
      (error) => {
        console.error("Products listener error:", error);
        onError(error);
      }
    );
  } catch (err) {
    console.error("listenToProducts init error:", err);
    onChange([]);
    return () => {};
  }
}

export function createProduct(product) {
  return addDoc(productsRef, {
    ...product,
    price: Number(product.price),
    rating: Number(product.rating || 4.5),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function updateProduct(id, product) {
  return updateDoc(doc(db, "products", id), {
    ...product,
    price: Number(product.price),
    rating: Number(product.rating || 4.5),
    updatedAt: serverTimestamp()
  });
}

export function deleteProduct(id) {
  return deleteDoc(doc(db, "products", id));
}
