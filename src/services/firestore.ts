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

export async function addEvaluation(evaluationData: Omit<Evaluation, 'id'>): Promise<string> {
  const pid = (evaluationData as any).patientId || (evaluationData as any).patient;
  const docRef = await addDoc(collection(db, 'evaluations'), {
    ...evaluationData,
    patient: pid,
    patientId: pid,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function deleteEvaluation(evaluationId: string): Promise<void> {
  await deleteDoc(doc(db, 'evaluations', evaluationId));
}
