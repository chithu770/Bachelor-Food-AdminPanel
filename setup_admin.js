import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBuW_waWGKb-5wC17NB2cRmw_cuYkH_k8Y",
  authDomain: "bachelor-foods.firebaseapp.com",
  projectId: "bachelor-foods",
  storageBucket: "bachelor-foods.firebasestorage.app",
  messagingSenderId: "685477622876",
  appId: "1:685477622876:web:ec0b678f5e60b32ea9a299"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const adminUid = "rC7fqyqk9XQnHXsosqx1iJqq1gx2";

async function authenticate() {
  const email = "inspect_user_temp@example.com";
  const password = "TempPassword123!";
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      throw err;
    }
  }
}


async function run() {
  await authenticate();
  const adminRef = doc(db, "users", adminUid);
  const snap = await getDoc(adminRef);
  if (!snap.exists()) {
    console.log("Admin user document not found! Creating...");
    await setDoc(adminRef, {
      uid: adminUid,
      email: "admin@bachelorfoods.com", // Adjust if needed
      displayName: "Super Admin",
      role: "admin", // Admin role required by some parts? Well we check user.uid===ADMIN_UID but just in case
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
    console.log("Admin user document created successfully.");
  } else {
    console.log("Admin user document already exists:", snap.data());
    // ensure role is admin
    if (snap.data().role !== "admin") {
      await setDoc(adminRef, { role: "admin" }, { merge: true });
      console.log("Updated role to admin");
    }
  }

  // Verify settings docs
  const settingsCollections = ["general", "business"];
  for (const s of settingsCollections) {
    const sRef = doc(db, "settings", s);
    const sSnap = await getDoc(sRef);
    if (!sSnap.exists()) {
      console.log(`Setting ${s} not found, creating empty doc`);
      await setDoc(sRef, {});
    } else {
      console.log(`Setting ${s} exists`);
    }
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
