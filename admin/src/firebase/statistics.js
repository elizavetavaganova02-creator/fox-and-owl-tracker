import { collection, getDocs } from 'firebase/firestore'
import { db } from './config.js'

function timestampDate(value) {
  if (value?.toDate) return value.toDate()
  if (value instanceof Date) return value
  return null
}

function isInPeriod(timestamp, start, end) {
  const date = timestampDate(timestamp)
  return date instanceof Date && !Number.isNaN(date.getTime()) && date >= start && date < end
}

function mapSnapshot(snapshot) {
  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  }))
}

function mapPaymentsSnapshot(snapshot) {
  return snapshot.docs.map((paymentDocument) => {
    const data = paymentDocument.data()
    return {
      id: paymentDocument.id,
      studentId: data.studentId,
      amount: Number(data.amount),
      currency: data.currency,
      paidAt: data.paidAt,
      monthKey: data.monthKey,
      note: data.note ?? '',
    }
  })
}

function mapCoinTransactionsSnapshot(snapshot) {
  return snapshot.docs.map((transactionDocument) => {
    const data = transactionDocument.data()

    const normalizedTransaction = {
      id: transactionDocument.id,
      studentId: data.studentId,
      amount: Number(data.amount),
      type: data.type,
      description: data.description ?? '',
      createdAt: data.createdAt,
    }

    return normalizedTransaction
  })
}

async function loadCoinTransactions() {
  const snapshot = await getDocs(collection(db, 'coinTransactions'))
  return mapCoinTransactionsSnapshot(snapshot)
}

async function loadActivityCollections() {
  const [lessonsSnapshot, coins, paymentsSnapshot] = await Promise.all([
    getDocs(collection(db, 'lessonRecords')),
    loadCoinTransactions(),
    getDocs(collection(db, 'payments')),
  ])

  return {
    lessons: mapSnapshot(lessonsSnapshot),
    coins,
    payments: mapPaymentsSnapshot(paymentsSnapshot),
  }
}

export function getPeriodBounds(period, now = new Date()) {
  if (period === 'previousMonth') {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 1),
    }
  }

  if (period === 'year') {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1),
    }
  }

  if (period === 'today') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    }
  }

  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  }
}

function incomeByCurrency(payments) {
  return payments.reduce((totals, payment) => {
    const currency = payment.currency || '—'
    const amount = Number(payment.amount)
    if (Number.isFinite(amount)) totals[currency] = (totals[currency] || 0) + amount
    return totals
  }, {})
}

function aggregateActivity(data, start, end) {
  const lessons = data.lessons
    .filter((lesson) => isInPeriod(lesson.date, start, end))
    .sort((first, second) => (timestampDate(second.date)?.getTime() ?? 0) - (timestampDate(first.date)?.getTime() ?? 0))
  const payments = data.payments
    .filter((payment) => isInPeriod(payment.paidAt, start, end))
    .sort((first, second) => (timestampDate(second.paidAt)?.getTime() ?? 0) - (timestampDate(first.paidAt)?.getTime() ?? 0))
  const transactionsInPeriod = data.coins.filter(
    (transaction) => isInPeriod(transaction.createdAt, start, end),
  )
  const positiveTransactions = transactionsInPeriod.filter(
    (transaction) => Number(transaction.amount) > 0,
  )
  const coinTotal = positiveTransactions.reduce(
    (total, transaction) => total + Number(transaction.amount),
    0,
  )
  const attendedLessons = lessons.filter((lesson) => lesson.attended === true).length

  return {
    lessons,
    payments,
    totalLessons: lessons.length,
    attendedLessons,
    missedLessons: lessons.length - attendedLessons,
    coinsIssued: coinTotal,
    paymentCount: payments.length,
    income: incomeByCurrency(payments),
    attendancePercent: lessons.length ? Math.round((attendedLessons / lessons.length) * 100) : 0,
  }
}

export async function getTodayDashboard() {
  const { start, end } = getPeriodBounds('today')
  const data = await loadActivityCollections()
  return aggregateActivity(data, start, end)
}

export async function getStatistics(period) {
  const data = await loadActivityCollections()
  const { start, end } = getPeriodBounds(period)
  const summary = aggregateActivity(data, start, end)
  const byStudent = summary.lessons.reduce((totals, lesson) => {
    const current = totals[lesson.studentId] || { lessons: 0, attended: 0 }
    current.lessons += 1
    if (lesson.attended === true) current.attended += 1
    totals[lesson.studentId] = current
    return totals
  }, {})

  return { ...summary, byStudent, start, end }
}
