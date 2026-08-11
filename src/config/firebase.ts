import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCNh8Hds8scVSkYEOyYIyhaxq8RFx270SI",
  authDomain: "intelligence-scales.firebaseapp.com",
  projectId: "intelligence-scales",
  storageBucket: "intelligence-scales.appspot.com",
  messagingSenderId: "719670613849",
  appId: "1:719670613849:web:4cafd088863462ff8ede48",
  measurementId: "G-H71E92HWYZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (typeof window !== 'undefined') {
  (window as any).db = db;
  (window as any).auth = auth;
  (window as any).dumpTable = async (tableId: string) => {
    const snap = await getDoc(doc(db, 'tables', tableId));
    const data = snap.exists() ? snap.data() : null;
    console.log(`=== DATA FOR ${tableId} ===`, data);
    return data;
  };
  (window as any).getToken = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.warn('No hay usuario autenticado actualmente');
      return null;
    }
    const token = await user.getIdToken();
    console.log('Bearer ' + token);
    return token;
  };
}
