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

const shiftsRef = collection(db, "shifts");

export function listenToShifts(onChange, onError) {
  return onSnapshot(
    query(shiftsRef),
    (snapshot) => {
      try {
        onChange(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch {
        onChange([]);
      }
    },
    (error) => {
      console.error("Shifts listener error:", error);
      if (onError) onError(error);
    }
  );
}

export async function createShift(data) {
  const newShift = await addDoc(shiftsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: newShift.id, ...data };
}

export async function updateShift(id, data) {
  await updateDoc(doc(db, "shifts", id), { ...data, updatedAt: serverTimestamp() });
  return { id, ...data };
}

export async function deleteShift(id) {
  await deleteDoc(doc(db, "shifts", id));
}
