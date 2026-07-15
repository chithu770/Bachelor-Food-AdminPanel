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

const vehiclesRef = collection(db, "vehicles");

export function listenToVehicles(onChange, onError) {
  return onSnapshot(
    query(vehiclesRef),
    (snapshot) => {
      try {
        onChange(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch {
        onChange([]);
      }
    },
    (error) => {
      console.error("Vehicles listener error:", error);
      if (onError) onError(error);
    }
  );
}

export async function createVehicle(data) {
  const newVehicle = await addDoc(vehiclesRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: newVehicle.id, ...data };
}

export async function updateVehicle(id, data) {
  await updateDoc(doc(db, "vehicles", id), { ...data, updatedAt: serverTimestamp() });
  return { id, ...data };
}

export async function deleteVehicle(id) {
  await deleteDoc(doc(db, "vehicles", id));
}
