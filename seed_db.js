import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, setDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
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

async function clearPlaceholders(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  for (const d of snap.docs) {
    if (d.id === "placeholder" || d.data().isPlaceholder) {
      await deleteDoc(doc(db, collectionName, d.id));
      console.log(`Deleted placeholder from ${collectionName}`);
    }
  }
}

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
  
  console.log("Authenticated. Beginning realistic seed...");

  const collectionsToClear = ["zones", "cuisines", "categories", "hotels", "products"];
  for (const c of collectionsToClear) {
    await clearPlaceholders(c);
  }

  // 1. Zones
  console.log("Seeding Zones...");
  const zoneRef = await addDoc(collection(db, "zones"), {
    name: "Downtown Bangalore",
    status: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  const zoneId = zoneRef.id;

  // 2. Cuisines
  console.log("Seeding Cuisines...");
  const cuisineIds = [];
  const cuisines = [
    { name: "South Indian", image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=400" },
    { name: "North Indian", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400" },
    { name: "Chinese", image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400" }
  ];
  for (const c of cuisines) {
    const ref = await addDoc(collection(db, "cuisines"), {
      ...c,
      status: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    cuisineIds.push({ id: ref.id, name: c.name });
  }

  // 3. Categories
  console.log("Seeding Categories...");
  let categoryId = null;
  const categories = [
    { name: "Breakfast", emoji: "🥞" },
    { name: "Biryani", emoji: "🍛" },
    { name: "Snacks", emoji: "🥟" }
  ];
  for (const c of categories) {
    const ref = await addDoc(collection(db, "categories"), {
      ...c,
      status: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    if (!categoryId) categoryId = ref.id;
  }

  // 4. Hotels
  console.log("Seeding Hotels...");
  const hotelRef = await addDoc(collection(db, "hotels"), {
    name: "Bachelor's Signature Kitchen",
    address: "Koramangala, 5th Block",
    phone: "+91 9876543210",
    email: "kitchen@bachelorfoods.com",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400",
    rating: 4.8,
    zoneId: zoneId,
    status: "active",
    open: true,
    latitude: 12.9352,
    longitude: 77.6245,
    minOrderAmount: 150,
    cuisines: cuisineIds.map(c => c.name),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  const hotelId = hotelRef.id;

  // 5. Products
  console.log("Seeding Products...");
  const products = [
    {
      name: "Hyderabadi Chicken Biryani",
      description: "Authentic dum biryani cooked with fragrant basmati rice and tender chicken pieces.",
      price: 250,
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
      categoryId: categoryId,
      hotelId: hotelId,
      rating: 4.5,
      status: true,
      veg: false
    },
    {
      name: "Masala Dosa",
      description: "Crispy crepe made from fermented batter, filled with potato curry.",
      price: 80,
      image: "https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=400",
      categoryId: categoryId,
      hotelId: hotelId,
      rating: 4.7,
      status: true,
      veg: true
    }
  ];
  for (const p of products) {
    await addDoc(collection(db, "products"), {
      ...p,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  console.log("Realistic Seeding Completed Successfully.");
}

run().then(() => process.exit(0)).catch(console.error);
