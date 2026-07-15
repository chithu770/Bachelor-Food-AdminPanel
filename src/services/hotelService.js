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

const hotelsRef = collection(db, "hotels");

export function listenToHotels(onChange, onError) {
  const q = query(hotelsRef, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      try {
        onChange(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      } catch {
        onChange([]);
      }
    },
    (error) => {
      console.error("Hotels listener error:", error);
      onError(error);
    }
  );
}

export function createHotel(hotel) {
  return addDoc(hotelsRef, {
    ...hotel,
    rating: Number(hotel.rating || 4.5),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function updateHotel(id, hotel) {
  return updateDoc(doc(db, "hotels", id), {
    ...hotel,
    rating: Number(hotel.rating || 4.5),
    updatedAt: serverTimestamp()
  });
}

export function deleteHotel(id) {
  return deleteDoc(doc(db, "hotels", id));
}
