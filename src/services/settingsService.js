import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firestore";

export async function getSettings(type) {
  const settingsRef = doc(db, "settings", type);
  const snapshot = await getDoc(settingsRef);
  return snapshot.exists() ? snapshot.data() : {};
}

export async function updateSettings(type, data) {
  const settingsRef = doc(db, "settings", type);
  await setDoc(settingsRef, data, { merge: true });
}
