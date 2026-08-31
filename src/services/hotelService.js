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
  setDoc
} from "../firebase/firestore";

export function listenToHotels(isPending, onChange, onError) {
  const collectionName = isPending ? "restaurant_users" : "hotels";
  const ref = collection(db, collectionName);
  // If pending, avoid orderBy("createdAt") because new documents from the app might be missing this field, causing Firestore to hide them.
  const q = isPending ? query(ref) : query(ref, orderBy("createdAt", "desc"));
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

export function createHotel(isPending, hotel) {
  // All new hotels must go through the pending flow, regardless of where they are added from.
  return addDoc(collection(db, "restaurant_users"), {
    ...hotel,
    status: "pending",
    rating: Number(hotel.rating || 4.5),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function updateHotel(isPending, id, hotel) {
  const collectionName = isPending ? "restaurant_users" : "hotels";
  return updateDoc(doc(db, collectionName, id), {
    ...hotel,
    rating: Number(hotel.rating || 4.5),
    updatedAt: serverTimestamp()
  });
}

export function deleteHotel(isPending, id) {
  const collectionName = isPending ? "restaurant_users" : "hotels";
  return deleteDoc(doc(db, collectionName, id));
}

export async function approveRestaurantRequest(id, hotelData) {
  // Update the request status
  await updateDoc(doc(db, "restaurant_users", id), {
    status: "active",
    approved: true,
    isApproved: true,
    approvedAt: serverTimestamp()
  });
  
  // Clean up data for hotels collection (removing status stuff meant for join requests)
  const cleanData = { ...hotelData };
  delete cleanData.id;
  
  // Add to main hotels collection with the same ID
  await setDoc(doc(db, "hotels", id), {
    ...cleanData,
    status: "active",
    open: true,
    rating: Number(hotelData.rating || 4.5),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
