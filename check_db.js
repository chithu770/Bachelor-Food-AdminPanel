import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

async function run() {
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

  const cols = ["zones", "cuisines", "categories", "hotels", "products", "orders", "users"];
  for (const c of cols) {
    const snap = await getDocs(collection(db, c));
    console.log(`${c}: ${snap.size} documents`);
  }
}

run().then(() => process.exit(0)).catch(console.error);
