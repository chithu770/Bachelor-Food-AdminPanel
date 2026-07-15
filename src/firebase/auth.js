import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { auth } from "./config";

export async function registerUser({ name, email, password }) {
  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(credentials.user, { displayName: name });
  }
  return credentials.user;
}

export async function loginUser({ email, password }) {
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  return credentials.user;
}

export function logoutUser() {
  return signOut(auth);
}
