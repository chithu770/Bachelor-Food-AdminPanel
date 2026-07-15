import {
  collection,
  db,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from "../firebase/firestore";

const deliveryUsersRef = collection(db, "delivery_users");

export async function fetchAllDeliveryPartners() {
  const snapshot = await getDocs(deliveryUsersRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export function listenToDeliveryPartners(onChange, onError) {
  return onSnapshot(
    deliveryUsersRef,
    (snapshot) => {
      try {
        onChange(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch {
        onChange([]);
      }
    },
    (error) => {
      console.error("Delivery Partners listener error:", error);
      if (onError) onError(error);
    }
  );
}

export async function createDeliveryPartner(data) {
  const partnerId = data.uid || doc(deliveryUsersRef).id;
  const partnerRef = doc(db, "delivery_users", partnerId);
  await setDoc(partnerRef, {
    ...data,
    uid: partnerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: partnerId, ...data };
}

export async function updateDeliveryPartner(id, data) {
  const partnerRef = doc(db, "delivery_users", id);
  await updateDoc(partnerRef, { ...data, updatedAt: serverTimestamp() });
  return { id, ...data };
}

export async function deleteDeliveryPartner(id) {
  await deleteDoc(doc(db, "delivery_users", id));
}
