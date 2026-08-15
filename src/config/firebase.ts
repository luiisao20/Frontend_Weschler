import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
