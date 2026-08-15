import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'
import { db } from './config.js'

const paymentsCollection = collection(db, 'payments')
const supportedCurrencies = new Set(['RUB', 'USD'])

export function createMonthKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Укажите корректную дату оплаты.')
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function paymentDataFromInput(input) {
  const amount = Number(input.amount)
  const currency = input.currency?.trim().toUpperCase()

  if (!input.studentId) throw new Error('Выберите ученика.')
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Сумма должна быть больше нуля.')
  if (!supportedCurrencies.has(currency)) throw new Error('Выберите RUB или USD.')
  if (!(input.paidAt instanceof Date) || Number.isNaN(input.paidAt.getTime())) {
    throw new Error('Укажите корректную дату оплаты.')
  }

  return {
    studentId: input.studentId,
    amount,
    currency,
    paidAt: Timestamp.fromDate(input.paidAt),
    monthKey: createMonthKey(input.paidAt),
    note: input.note?.trim() || '',
  }
}

export async function getPayments() {
  try {
    const snapshot = await getDocs(collection(db, 'payments'))
    const payments = snapshot.docs.map((paymentDoc) => {
      const data = paymentDoc.data()

      const payment = {
        id: paymentDoc.id,
        studentId: data.studentId,
        amount: Number(data.amount),
        currency: data.currency,
        paidAt: data.paidAt,
        monthKey: data.monthKey,
        note: data.note ?? '',
      }

      return payment
    })

    return payments.sort((first, second) => {
      const firstTime = first.paidAt?.toMillis?.() ?? 0
      const secondTime = second.paidAt?.toMillis?.() ?? 0
      return secondTime - firstTime
    })
  } catch (error) {
    console.error('PAYMENTS FIREBASE ERROR:', {
      code: error?.code,
      message: error?.message,
      error,
    })
    throw error
  }
}

export async function addPayment(input) {
  const paymentData = paymentDataFromInput(input)
  const paymentDocument = await addDoc(paymentsCollection, paymentData)
  return { id: paymentDocument.id, ...paymentData }
}

export async function updatePayment(paymentId, input) {
  await updateDoc(doc(db, 'payments', paymentId), paymentDataFromInput(input))
}

export async function deletePayment(paymentId) {
  await deleteDoc(doc(db, 'payments', paymentId))
}

export function calculateMonthlyIncome(payments) {
  return payments.reduce((totals, payment) => {
    const currency = payment.currency || '—'
    const amount = Number(payment.amount)
    totals[currency] = (totals[currency] || 0) + (Number.isFinite(amount) ? amount : 0)
    return totals
  }, {})
}
