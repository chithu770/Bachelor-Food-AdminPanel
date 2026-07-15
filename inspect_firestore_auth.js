import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBuW_waWGKb-5wC17NB2cRmw_cuYkH_k8Y",
  authDomain: "bachelor-foods.firebaseapp.com",
  projectId: "bachelor-foods",
  storageBucket: "bachelor-foods.firebasestorage.app",
  messagingSenderId: "685477622876",
  appId: "1:685477622876:web:ec0b678f5e60b32ea9a299",
  measurementId: "G-E5RSRLMX2Y"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function authenticate() {
  const email = "inspect_user_temp@example.com";
  const password = "TempPassword123!";
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log(`Successfully signed in! UID: ${cred.user.uid}`);
  } catch (err) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log(`Successfully registered! UID: ${cred.user.uid}`);
    } else {
      throw err;
    }
  }
}

async function run() {
  await authenticate();
  console.log("\nQuerying delivery users...");
  try {
    const snap = await getDocs(collection(db, "delivery_users"));
    console.log(`Found ${snap.size} delivery users.`);
    snap.docs.forEach(d => console.log(d.id, d.data()));
  } catch (err) {
    console.error("Query users failed:", err);
  }
  
  console.log("\nQuerying orders...");
  try {
    const snap = await getDocs(collection(db, "orders"));
    console.log(`Found ${snap.size} orders.`);
    snap.docs.slice(0,2).forEach(d => console.log(d.id, d.data()));
  } catch (err) {
    console.error("Query orders failed:", err);
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
