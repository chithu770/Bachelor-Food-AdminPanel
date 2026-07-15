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

const campaignsRef = collection(db, "campaigns");

export function listenToCampaigns(onChange, onError) {
  try {
    const q = query(campaignsRef, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
          onChange(items);
        } catch (err) {
          console.error("Error mapping campaigns:", err);
          onChange([]);
        }
      },
      (error) => {
        console.error("Campaigns listener error:", error);
        onError(error);
      }
    );
  } catch (err) {
    console.error("listenToCampaigns init error:", err);
    onChange([]);
    return () => {};
  }
}

export function createCampaign(campaign) {
  return addDoc(campaignsRef, {
    ...campaign,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function updateCampaign(id, campaign) {
  return updateDoc(doc(db, "campaigns", id), {
    ...campaign,
    updatedAt: serverTimestamp()
  });
}

export function deleteCampaign(id) {
  return deleteDoc(doc(db, "campaigns", id));
}
