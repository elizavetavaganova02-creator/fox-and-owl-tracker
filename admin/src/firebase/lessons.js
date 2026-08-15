import {
  Timestamp,
  collection,
  doc,
  getDocsFromServer,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore'
import { db } from './config.js'

const lessonRecordsCollection = collection(db, 'lessonRecords')

export function calculateLessonCoins({ attended, homework, activity }) {
  return (attended ? 5 : 0) + (homework ? 5 : 0) + (activity ? 5 : 0)
}

function toTimestamp(value) {
  if (value instanceof Timestamp) return value
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error('Укажите корректные дату и время урока.')
  }
  return Timestamp.fromDate(value)
}

function numberValue(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getStudentTotals(snapshot) {
  const data = snapshot.data()
  return {
    coinsBalance: numberValue(data.coinsBalance),
    coinsEarnedTotal: numberValue(data.coinsEarnedTotal),
    lessonsCompleted: numberValue(data.lessonsCompleted),
  }
}

function applyStudentDelta(totals, coinDelta, lessonDelta) {
  const nextTotals = {
    coinsBalance: totals.coinsBalance + coinDelta,
    coinsEarnedTotal: totals.coinsEarnedTotal + coinDelta,
    lessonsCompleted: totals.lessonsCompleted + lessonDelta,
  }

  if (Object.values(nextTotals).some((value) => value < 0)) {
    throw new Error('Операция отменена: показатели ученика не могут стать отрицательными.')
  }

  return nextTotals
}

function lessonRecordFromInput(input) {
  return {
    studentId: input.studentId,
    date: toTimestamp(input.date),
    attended: Boolean(input.attended),
    homework: Boolean(input.homework),
    activity: Boolean(input.activity),
    coins: calculateLessonCoins(input),
    note: input.note?.trim() || '',
  }
}

function coinTransactionFromLesson(lesson) {
  return {
    studentId: lesson.studentId,
    amount: lesson.coins,
    type: 'lesson',
    description: 'Награда за урок',
    createdAt: lesson.date,
  }
}

export async function getLessons() {
  const snapshot = await getDocsFromServer(
    query(lessonRecordsCollection, orderBy('date', 'desc')),
  )

  return snapshot.docs.map((lessonDocument) => ({
    id: lessonDocument.id,
    ...lessonDocument.data(),
  }))
}

export async function createLesson(input) {
  const lesson = lessonRecordFromInput(input)
  const lessonReference = doc(lessonRecordsCollection)
  const studentReference = doc(db, 'students', lesson.studentId)
  const coinTransactionReference = doc(db, 'coinTransactions', lessonReference.id)

  await runTransaction(db, async (transaction) => {
    const studentSnapshot = await transaction.get(studentReference)
    if (!studentSnapshot.exists()) throw new Error('Выбранный ученик не найден.')

    const nextTotals = applyStudentDelta(
      getStudentTotals(studentSnapshot),
      lesson.coins,
      lesson.attended ? 1 : 0,
    )

    transaction.set(lessonReference, lesson)
    transaction.update(studentReference, nextTotals)
    if (lesson.coins > 0) {
      transaction.set(coinTransactionReference, coinTransactionFromLesson(lesson))
    }
  })

  return { id: lessonReference.id, ...lesson }
}

export async function updateLesson(lessonId, input) {
  const nextLesson = lessonRecordFromInput(input)
  const lessonReference = doc(db, 'lessonRecords', lessonId)
  const coinTransactionReference = doc(db, 'coinTransactions', lessonId)

  await runTransaction(db, async (transaction) => {
    const lessonSnapshot = await transaction.get(lessonReference)
    if (!lessonSnapshot.exists()) throw new Error('Урок больше не существует.')

    const previousLesson = lessonSnapshot.data()
    const previousStudentReference = doc(db, 'students', previousLesson.studentId)
    const nextStudentReference = doc(db, 'students', nextLesson.studentId)
    const previousStudentSnapshot = await transaction.get(previousStudentReference)
    if (!previousStudentSnapshot.exists()) throw new Error('Ученик из исходного урока не найден.')

    let nextStudentSnapshot = previousStudentSnapshot
    if (previousLesson.studentId !== nextLesson.studentId) {
      nextStudentSnapshot = await transaction.get(nextStudentReference)
      if (!nextStudentSnapshot.exists()) throw new Error('Выбранный ученик не найден.')
    }

    if (previousLesson.studentId === nextLesson.studentId) {
      const coinDelta = nextLesson.coins - numberValue(previousLesson.coins)
      const lessonDelta = Number(nextLesson.attended) - Number(Boolean(previousLesson.attended))
      transaction.update(
        nextStudentReference,
        applyStudentDelta(getStudentTotals(nextStudentSnapshot), coinDelta, lessonDelta),
      )
    } else {
      transaction.update(
        previousStudentReference,
        applyStudentDelta(
          getStudentTotals(previousStudentSnapshot),
          -numberValue(previousLesson.coins),
          previousLesson.attended ? -1 : 0,
        ),
      )
      transaction.update(
        nextStudentReference,
        applyStudentDelta(
          getStudentTotals(nextStudentSnapshot),
          nextLesson.coins,
          nextLesson.attended ? 1 : 0,
        ),
      )
    }

    transaction.set(lessonReference, nextLesson)
    if (nextLesson.coins > 0) {
      transaction.set(coinTransactionReference, coinTransactionFromLesson(nextLesson))
    } else {
      transaction.delete(coinTransactionReference)
    }
  })
}

export async function deleteLesson(lessonId) {
  const lessonReference = doc(db, 'lessonRecords', lessonId)
  const coinTransactionReference = doc(db, 'coinTransactions', lessonId)

  await runTransaction(db, async (transaction) => {
    const lessonSnapshot = await transaction.get(lessonReference)
    if (!lessonSnapshot.exists()) throw new Error('Урок уже удалён.')

    const lesson = lessonSnapshot.data()
    const studentReference = doc(db, 'students', lesson.studentId)
    const studentSnapshot = await transaction.get(studentReference)
    if (!studentSnapshot.exists()) throw new Error('Ученик для этого урока не найден.')

    transaction.update(
      studentReference,
      applyStudentDelta(
        getStudentTotals(studentSnapshot),
        -numberValue(lesson.coins),
        lesson.attended ? -1 : 0,
      ),
    )
    transaction.delete(lessonReference)
    transaction.delete(coinTransactionReference)
  })
}
