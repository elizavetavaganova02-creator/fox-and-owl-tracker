import { initializeApp } from 'firebase/app'
import { browserSessionPersistence, initializeAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingConfig.length > 0) {
  throw new Error('Не заполнены настройки Firebase в файле .env.local.')
}

const app = initializeApp(firebaseConfig)
const auth = initializeAuth(app, {
  persistence: browserSessionPersistence,
})
const db = getFirestore(app)

if (app.options.projectId !== 'fox-and-owl') {
  throw new Error(
    `Admin подключён к неверному Firebase project: ${app.options.projectId || 'не указан'}.`,
  )
}

if (auth.app !== app || db.app !== app) {
  throw new Error('Firebase Authentication и Firestore подключены к разным приложениям.')
}

export { app, auth, db }
