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

const addonsRef = collection(db, "addons");

export function listenToAddons(onChange, onError) {
  return onSnapshot(
    query(addonsRef),
    (snapshot) => {
      try {
        onChange(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch {
        onChange([]);
      }
    },
    (error) => {
      console.error("Addons listener error:", error);
      if (onError) onError(error);
    }
  );
}

export async function createAddon(data) {
  const newAddon = await addDoc(addonsRef, {
    ...data,
    price: Number(data.price),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: newAddon.id, ...data };
}

export async function updateAddon(id, data) {
  await updateDoc(doc(db, "addons", id), { 
    ...data, 
    price: data.price !== undefined ? Number(data.price) : undefined,
    updatedAt: serverTimestamp() 
  });
  return { id, ...data };
}

export async function deleteAddon(id) {
  await deleteDoc(doc(db, "addons", id));
}
