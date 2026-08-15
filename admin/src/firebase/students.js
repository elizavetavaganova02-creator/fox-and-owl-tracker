import {
  addDoc,
  collection,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from './config.js'

const studentsCollection = collection(db, 'students')

function sortStudents(students) {
  return students.sort((first, second) => {
    if (first.active !== second.active) return first.active ? -1 : 1
    return (first.sortOrder ?? 0) - (second.sortOrder ?? 0)
  })
}

export async function getStudents() {
  const snapshot = await getDocsFromServer(
    query(studentsCollection, orderBy('sortOrder', 'asc')),
  )

  return sortStudents(
    snapshot.docs.map((studentDocument) => ({
      id: studentDocument.id,
      ...studentDocument.data(),
    })),
  )
}

export async function addStudent({ name, avatar }) {
  const highestOrderSnapshot = await getDocsFromServer(
    query(studentsCollection, orderBy('sortOrder', 'desc'), limit(1)),
  )
  const highestOrder = highestOrderSnapshot.empty
    ? 0
    : Number(highestOrderSnapshot.docs[0].data().sortOrder) || 0

  const studentData = {
    name: name.trim(),
    avatar,
    coinsBalance: 0,
    coinsEarnedTotal: 0,
    lessonsCompleted: 0,
    streak: 0,
    active: true,
    sortOrder: highestOrder + 1,
  }

  const studentDocument = await addDoc(studentsCollection, studentData)
  return { id: studentDocument.id, ...studentData }
}

export async function updateStudent(studentId, { name, avatar }) {
  await updateDoc(doc(db, 'students', studentId), {
    name: name.trim(),
    avatar,
  })
}

export async function setStudentActive(studentId, active) {
  await updateDoc(doc(db, 'students', studentId), { active })
}
