import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addPayment,
  calculateMonthlyIncome,
  createMonthKey,
  deletePayment,
  getPayments,
  updatePayment,
} from '../firebase/payments.js'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js'
import DeletePaymentDialog from './DeletePaymentDialog.jsx'
import PaymentFormDialog from './PaymentFormDialog.jsx'
import StatusMessage from './StatusMessage.jsx'
import { UiIcon } from './UiIcon.jsx'

function currentMonthKey() {
  return createMonthKey(new Date())
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return 'выбранный месяц'
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1, 1))
}

function formatPaymentDate(timestamp) {
  if (!timestamp?.toDate) return { date: '—', time: '—' }
  const value = timestamp.toDate()
  return {
    date: new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(value),
    time: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(value),
  }
}

function formatMoney(amount, currency) {
  try {
    const hasFraction = !Number.isInteger(amount)
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString('ru-RU')} ${currency}`
  }
}

export default function PaymentsPage({ students }) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  const [selectedStudent, setSelectedStudent] = useState('all')
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [success, setSuccess] = useState('')
  const [formError, setFormError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [paymentToDelete, setPaymentToDelete] = useState(null)

  const loadPayments = useCallback(async () => {
    const items = await getPayments()
    setPayments(items)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    getPayments()
      .then((items) => active && setPayments(items))
      .catch((paymentLoadError) => {
        console.error('Не удалось загрузить payments:', paymentLoadError)
        if (active) {
          setPayments([])
          setLoadError(getFirebaseErrorMessage(paymentLoadError, 'Не удалось загрузить оплаты.'))
        }
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const studentNames = useMemo(
    () => Object.fromEntries(students.map((student) => [student.id, student.name])),
    [students],
  )
  const paymentsForSelectedMonth = payments.filter(
    (payment) => payment.monthKey === selectedMonth,
  )
  const monthlyIncome = useMemo(
    () => calculateMonthlyIncome(paymentsForSelectedMonth),
    [paymentsForSelectedMonth],
  )
  const filteredPayments = selectedStudent === 'all'
    ? paymentsForSelectedMonth
    : paymentsForSelectedMonth.filter((payment) => payment.studentId === selectedStudent)

  function openCreateForm() {
    setEditingPayment(null)
    setFormError('')
    setFormOpen(true)
  }

  function openEditForm(payment) {
    setEditingPayment(payment)
    setFormError('')
    setFormOpen(true)
  }

  async function handleSave(values) {
    setBusy(true)
    setError('')
    setSuccess('')
    setFormError('')
    try {
      if (editingPayment) {
        await updatePayment(editingPayment.id, values)
        setSuccess('Изменения сохранены')
      } else {
        await addPayment(values)
        setSuccess('Оплата добавлена')
      }

      const targetMonth = createMonthKey(values.paidAt)
      await loadPayments()
      setSelectedMonth(targetMonth)
      setFormOpen(false)
    } catch (saveError) {
      setFormError(getFirebaseErrorMessage(saveError, 'Не удалось сохранить оплату.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await deletePayment(paymentToDelete.id)
      await loadPayments()
      setPaymentToDelete(null)
      setSuccess('Оплата удалена')
    } catch (deleteError) {
      setError(getFirebaseErrorMessage(deleteError, 'Не удалось удалить оплату.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <header className="page-header">
        <div><p className="eyebrow">Финансы</p><h1>Оплаты</h1></div>
        <button className="primary-button add-student-button" disabled={!students.length} onClick={openCreateForm} type="button">+ Добавить оплату</button>
      </header>

      <section className="income-card">
        <div><p>Доход за {monthLabel(selectedMonth)}</p><span>Рассчитано из оплат</span></div>
        <div className="income-totals">
          {Object.keys(monthlyIncome).length
            ? Object.entries(monthlyIncome).map(([currency, amount]) => (
              <strong key={currency}>
                {Object.keys(monthlyIncome).length > 1 ? `${currency}: ` : ''}
                {formatMoney(amount, currency)}
              </strong>
            ))
            : <strong>0</strong>}
        </div>
      </section>

      <div className="payment-filters">
        <label>Месяц<input type="month" value={selectedMonth} onChange={(event) => event.target.value && setSelectedMonth(event.target.value)} /></label>
        <label>Ученик<select value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)}><option value="all">Все ученики</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
      </div>

      <div className="page-messages" aria-live="polite">
        <StatusMessage>{loadError || error}</StatusMessage>
        <StatusMessage type="success">{success}</StatusMessage>
      </div>

      {loading ? (
        <div className="content-loader"><div className="loader" /><p>Загружаем оплаты...</p></div>
      ) : loadError ? (
        <section className="empty-state empty-state--error"><span className="empty-icon"><UiIcon name="warning" size={30} /></span><h2>Не удалось загрузить оплаты</h2><p>Проверьте подключение и попробуйте выбрать месяц ещё раз.</p></section>
      ) : filteredPayments.length ? (
        <div className="lessons-table-wrap">
          <table className="lessons-table payments-table">
            <thead><tr><th>Дата</th><th>Ученик</th><th>Сумма</th><th>Валюта</th><th>Комментарий</th><th aria-label="Действия" /></tr></thead>
            <tbody>{filteredPayments.map((payment) => {
              const paidAt = formatPaymentDate(payment.paidAt)
              return (
                <tr key={payment.id}>
                  <td><strong>{paidAt.date}</strong><small>{paidAt.time}</small></td>
                  <td>{studentNames[payment.studentId] || 'Неизвестный ученик'}</td>
                  <td><strong className="payment-amount">{formatMoney(Number(payment.amount) || 0, payment.currency)}</strong></td>
                  <td>{payment.currency}</td>
                  <td className="lesson-note">{payment.note || '—'}</td>
                  <td><div className="table-actions"><button disabled={busy} onClick={() => openEditForm(payment)} type="button">Редактировать</button><button className="delete-link" disabled={busy} onClick={() => setPaymentToDelete(payment)} type="button">Удалить</button></div></td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      ) : (
        <section className="empty-state"><span className="empty-icon"><UiIcon name="receipt" size={30} /></span><h2>Оплат за этот месяц нет</h2><p>Добавьте оплату или выберите другой месяц.</p></section>
      )}

      {formOpen && <PaymentFormDialog error={formError} onClose={() => !busy && setFormOpen(false)} onSave={handleSave} payment={editingPayment} saving={busy} students={students} />}
      {paymentToDelete && <DeletePaymentDialog onCancel={() => !busy && setPaymentToDelete(null)} onConfirm={handleDelete} saving={busy} />}
    </>
  )
}
