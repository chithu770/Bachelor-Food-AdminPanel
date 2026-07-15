import {
  collection,
  db,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "../firebase/firestore";

const usersRef = collection(db, "users");

export async function createUser(authUser) {
  const userRef = doc(db, "users", authUser.uid);
  await setDoc(userRef, {
    uid: authUser.uid,
    email: authUser.email,
    displayName: authUser.displayName || "",
    role: authUser.role || "user",
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp()
  });
  return { id: authUser.uid, ...(await getDoc(userRef)).data() };
}

export async function fetchAllUsers() {
  const snapshot = await getDocs(query(usersRef));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function updateUser(uid, data) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
  return { id: uid, ...(await getDoc(userRef)).data() };
}

export async function deleteUser(uid) {
  await deleteDoc(doc(db, "users", uid));
}

export function listenToUsers(onChange, onError) {
  return onSnapshot(
    query(usersRef),
    (snapshot) => {
      try {
        onChange(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch {
        onChange([]);
      }
    },
    (error) => {
      console.error("Users listener error:", error);
      onError(error);
    }
  );
}
