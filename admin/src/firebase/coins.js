import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config.js'

const coinTransactionsCollection = collection(db, 'coinTransactions')
const manualTypes = new Set(['bonus', 'adjustment', 'reward'])

function numberValue(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function validateManualOperation(input) {
  const amount = Number(input.amount)
  if (!input.studentId) throw new Error('Выберите ученика.')
  if (!manualTypes.has(input.type)) throw new Error('Выберите тип операции.')
  if (!Number.isFinite(amount) || amount === 0) throw new Error('Сумма должна отличаться от нуля.')
  if (input.type === 'bonus' && amount <= 0) throw new Error('Бонус должен быть положительным.')
  if (input.type === 'reward' && amount >= 0) throw new Error('Списание должно быть отрицательным.')

  return {
    studentId: input.studentId,
    amount,
    type: input.type,
    description: input.description?.trim() || '',
  }
}

export async function getCoinTransactions() {
  const snapshot = await getDocs(coinTransactionsCollection)
  return snapshot.docs
    .map((transactionDocument) => {
      const data = transactionDocument.data()
      return {
        id: transactionDocument.id,
        studentId: data.studentId,
        amount: numberValue(data.amount),
        type: data.type,
        description: data.description ?? '',
        createdAt: data.createdAt,
      }
    })
    .sort((first, second) => {
      const firstTime = first.createdAt?.toMillis?.() ?? 0
      const secondTime = second.createdAt?.toMillis?.() ?? 0
      return secondTime - firstTime
    })
}

export async function createManualCoinOperation(input) {
  const operation = validateManualOperation(input)
  const studentReference = doc(db, 'students', operation.studentId)
  const transactionReference = doc(coinTransactionsCollection)

  await runTransaction(db, async (transaction) => {
    const studentSnapshot = await transaction.get(studentReference)
    if (!studentSnapshot.exists()) throw new Error('Выбранный ученик не найден.')

    const student = studentSnapshot.data()
    const currentBalance = numberValue(student.coinsBalance)
    const currentEarnedTotal = numberValue(student.coinsEarnedTotal)
    const nextBalance = currentBalance + operation.amount

    if (nextBalance < 0) {
      throw new Error('Недостаточно монет на балансе')
    }

    const studentUpdate = { coinsBalance: nextBalance }
    if (operation.amount > 0) {
      studentUpdate.coinsEarnedTotal = currentEarnedTotal + operation.amount
    }

    transaction.update(studentReference, studentUpdate)
    transaction.set(transactionReference, {
      ...operation,
      createdAt: serverTimestamp(),
    })
  })

  return transactionReference.id
}
