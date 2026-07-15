import {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc
} from "../firebase/firestore";

export function listenToSubscriptions(type, onChange, onError) {
  try {
    if (type === "all") {
      let weeklyData = [];
      let monthlyData = [];

      const triggerChange = () => {
        onChange([...weeklyData, ...monthlyData]);
      };

      const unsubWeekly = onSnapshot(
        query(collection(db, "subscriptions", "weekly_subscriptions", "documents")),
        (snapshot) => {
          weeklyData = snapshot.docs.map(doc => ({ id: doc.id, _collection: "weekly", ...doc.data() }));
          triggerChange();
        },
        onError
      );

      const unsubMonthly = onSnapshot(
        query(collection(db, "subscriptions", "monthly_subscriptions", "documents")),
        (snapshot) => {
          monthlyData = snapshot.docs.map(doc => ({ id: doc.id, _collection: "monthly", ...doc.data() }));
          triggerChange();
        },
        onError
      );

      return () => {
        unsubWeekly();
        unsubMonthly();
      };
    }

    // type should be 'weekly' or 'monthly'
    // Structure: subscriptions/{weekly_subscriptions|monthly_subscriptions}/documents/{docId}
    const subscriptionsRef = collection(db, "subscriptions", `${type}_subscriptions`, "documents");
    const q = query(subscriptionsRef);
    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const items = snapshot.docs.map((item) => ({ id: item.id, _collection: type, ...item.data() }));
          onChange(items);
        } catch (err) {
          console.error(`Error mapping ${type} subscriptions:`, err);
          onChange([]);
        }
      },
      (error) => {
        console.error(`${type} listener error:`, error);
        onError(error);
      }
    );
  } catch (err) {
    console.error(`listenToSubscriptions init error for ${type}:`, err);
    onChange([]);
    return () => {};
  }
}

export function createSubscription(type, data) {
  return addDoc(collection(db, "subscriptions", `${type}_subscriptions`, "documents"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function updateSubscription(type, id, data) {
  return updateDoc(doc(db, "subscriptions", `${type}_subscriptions`, "documents", id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export function deleteSubscription(type, id) {
  return deleteDoc(doc(db, "subscriptions", `${type}_subscriptions`, "documents", id));
}
