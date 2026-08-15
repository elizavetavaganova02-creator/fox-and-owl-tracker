import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDocFromServer } from 'firebase/firestore'
import { auth, db } from './config.js'

export function observeAuth(callback, errorCallback) {
  return onAuthStateChanged(auth, callback, errorCallback)
}

export async function loginAdmin(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function verifyAdmin(user) {
  if (!user) return false

  const adminRef = doc(db, 'admins', user.uid)
  const adminSnapshot = await getDocFromServer(adminRef)
  return adminSnapshot.exists()
}

export function logoutAdmin() {
  return signOut(auth)
}
