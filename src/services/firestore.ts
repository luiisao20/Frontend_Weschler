import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Patient, Evaluation } from '../types';

// Patients CRUD
export async function getPatients(): Promise<Patient[]> {
  const querySnapshot = await getDocs(collection(db, 'patients'));
  const patients: Patient[] = [];
  querySnapshot.forEach(docSnap => {
    patients.push({
      ...docSnap.data(),
      id: docSnap.id
    } as Patient);
  });
  return patients;
}

export async function getPatientsByOwner(ownerEmail: string): Promise<Patient[]> {
  const q = query(collection(db, 'patients'), where('owner', '==', ownerEmail));
  const querySnapshot = await getDocs(q);
  const patients: Patient[] = [];
  querySnapshot.forEach(docSnap => {
    patients.push({
      ...docSnap.data(),
      id: docSnap.id
    } as Patient);
  });
  return patients;
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  const docSnap = await getDoc(doc(db, 'patients', patientId));
  if (!docSnap.exists()) return null;
  return {
    ...docSnap.data(),
    id: docSnap.id
  } as Patient;
}

export async function addPatient(patientData: Omit<Patient, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'patients'), {
    ...patientData,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function updatePatient(patientId: string, patientData: Partial<Patient>): Promise<void> {
  await updateDoc(doc(db, 'patients', patientId), patientData);
}

export async function deletePatient(patientId: string): Promise<void> {
  // Delete all patient's evaluations first
  const q1 = query(collection(db, 'evaluations'), where('patient', '==', patientId));
  const q2 = query(collection(db, 'evaluations'), where('patientId', '==', patientId));
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const deletePromises: Promise<void>[] = [];
  snap1.docs.forEach(docSnap => deletePromises.push(deleteDoc(doc(db, 'evaluations', docSnap.id))));
  snap2.docs.forEach(docSnap => deletePromises.push(deleteDoc(doc(db, 'evaluations', docSnap.id))));
  await Promise.all(deletePromises);

  // Delete patient document
  await deleteDoc(doc(db, 'patients', patientId));
}

// Evaluations CRUD
export async function getEvaluationsByPatient(patientId: string): Promise<Evaluation[]> {
  const q1 = query(collection(db, 'evaluations'), where('patient', '==', patientId));
  const q2 = query(collection(db, 'evaluations'), where('patientId', '==', patientId));

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const evalMap = new Map<string, Evaluation>();

  snap1.forEach(docSnap => {
    evalMap.set(docSnap.id, {
      ...docSnap.data(),
      id: docSnap.id
    } as Evaluation);
  });

  snap2.forEach(docSnap => {
    evalMap.set(docSnap.id, {
      ...docSnap.data(),
      id: docSnap.id
    } as Evaluation);
  });

  return Array.from(evalMap.values());
}

export async function addEvaluation(evaluationData: Omit<Evaluation, 'id'> | (Partial<Evaluation> & Record<string, any>)): Promise<string> {
  const rawAge = evaluationData.age || {};
  const age = {
    years: typeof rawAge.years === 'number' ? rawAge.years : (evaluationData.years || 0),
    months: typeof rawAge.months === 'number' ? rawAge.months : (evaluationData.months || 0),
    days: typeof rawAge.days === 'number' ? rawAge.days : (evaluationData.days || 0)
  };

  const docRef = await addDoc(collection(db, 'evaluations'), {
    ...evaluationData,
    age,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getEvaluationById(evaluationId: string): Promise<Evaluation | null> {
  const docSnap = await getDoc(doc(db, 'evaluations', evaluationId));
  if (!docSnap.exists()) return null;
  return {
    ...docSnap.data(),
    id: docSnap.id
  } as Evaluation;
}

export async function updateEvaluation(evaluationId: string, evaluationData: Partial<Evaluation>): Promise<void> {
  await updateDoc(doc(db, 'evaluations', evaluationId), evaluationData);
}

export async function getEvaluationByVerificationCode(code: string): Promise<Evaluation | null> {
  const cleanCode = code.trim().toUpperCase();
  const q = query(collection(db, 'evaluations'), where('verificationCode', '==', cleanCode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return {
    ...docSnap.data(),
    id: docSnap.id
  } as Evaluation;
}

export async function deleteEvaluation(evaluationId: string): Promise<void> {
  await deleteDoc(doc(db, 'evaluations', evaluationId));
}
