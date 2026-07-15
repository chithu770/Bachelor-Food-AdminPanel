import {
  collection,
  db,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch
} from "../firebase/firestore";

function cartItemRef(userId, productId) {
  return doc(db, "carts", userId, "items", productId);
}

function cartDocRef(userId) {
  return doc(db, "carts", userId);
}

export function listenToCart(userId, onChange, onError) {
  return onSnapshot(
    collection(db, "carts", userId, "items"),
    (snapshot) => onChange(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError
  );
}

export function listenToAllCarts(onChange, onError) {
  let snapshotUnsub;

  async function refreshAll() {
    try {
      const cartsSnapshot = await getDocs(collection(db, "carts"));
      const allItems = [];
      for (const cartDoc of cartsSnapshot.docs) {
        const userId = cartDoc.id;
        const itemsSnapshot = await getDocs(query(collection(db, "carts", userId, "items"), limit(500)));
        itemsSnapshot.forEach((itemDoc) => {
          allItems.push({
            id: itemDoc.id,
            userId: userId,
            ...itemDoc.data()
          });
        });
      }
      onChange(allItems);
    } catch (err) {
      console.error("Error fetching all cart items:", err);
      onChange([]);
      if (onError) onError(err);
    }
  }

  refreshAll();

  snapshotUnsub = onSnapshot(
    collection(db, "carts"),
    () => { refreshAll(); },
    (error) => {
      console.error("All carts listener error:", error);
      if (onError) onError(error);
    }
  );

  return () => { if (snapshotUnsub) snapshotUnsub(); };
}

export async function addCartItem(userId, product, quantity = 1) {
  const batch = writeBatch(db);
  batch.set(
    cartItemRef(userId, product.id),
    {
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: Number(product.price),
      hotelName: product.hotelName,
      quantity,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  batch.set(
    cartDocRef(userId),
    { lastModified: serverTimestamp() },
    { merge: true }
  );
  await batch.commit();
}

export async function updateCartItem(userId, productId, quantity) {
  const batch = writeBatch(db);
  batch.update(cartItemRef(userId, productId), {
    quantity: Math.max(1, Number(quantity)),
    updatedAt: serverTimestamp()
  });
  batch.set(
    cartDocRef(userId),
    { lastModified: serverTimestamp() },
    { merge: true }
  );
  await batch.commit();
}

export async function removeCartItem(userId, productId) {
  const batch = writeBatch(db);
  batch.delete(cartItemRef(userId, productId));
  batch.set(
    cartDocRef(userId),
    { lastModified: serverTimestamp() },
    { merge: true }
  );
  await batch.commit();
}
