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
    <div className="payments-page">
      <header className="page-header payments-header">
        <div><p className="eyebrow">Финансы</p><h1>Оплаты</h1><span>Доход и история фактических поступлений</span></div>
        <button className="primary-button add-student-button" disabled={!students.length} onClick={openCreateForm} type="button">+ Добавить оплату</button>
      </header>

      {!loadError && <>
      <section className="payments-overview">
        <article className="payments-income-card">
          <img alt="" src="/payments/payments_icon_income.png" />
          <div className="payments-income-copy"><p>Доход за {monthLabel(selectedMonth)}</p><span>Рассчитано из фактических оплат</span></div>
          <div className="payments-income-totals">
            {Object.keys(monthlyIncome).length
              ? Object.entries(monthlyIncome).map(([currency, amount]) => (
                <div key={currency}><img alt="" src={currency === 'USD' ? '/payments/payments_icon_usd.png' : '/payments/payments_icon_rub.png'} /><span>{currency}</span><strong>{formatMoney(amount, currency)}</strong></div>
              ))
              : <strong className="payments-income-zero">0</strong>}
          </div>
        </article>
        <article className="payments-count-card"><img alt="" src="/payments/payments_icon_receipt.png" /><div><span>Оплат за месяц</span><strong>{paymentsForSelectedMonth.length}</strong></div></article>
      </section>

      <section className="payments-support-card"><img alt="Лиса и сова рядом с оплатами" src="/payments/payments_header_fox_owl.png" /><div><p className="eyebrow">Fox & Owl</p><h2>Все поступления — в одном месте</h2><span>Фактические оплаты сохраняются в истории и автоматически попадают в доход.</span></div></section>

      <div className="payment-filters payments-filter-card">
        <div><p className="eyebrow">Фильтры</p><span>Настройте отображение истории</span></div>
        <label>Месяц<input type="month" value={selectedMonth} onChange={(event) => event.target.value && setSelectedMonth(event.target.value)} /></label>
        <label>Ученик<select value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)}><option value="all">Все ученики</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
      </div>
      </>}

      <div className="page-messages" aria-live="polite">
        <StatusMessage>{loadError || error}</StatusMessage>
        <StatusMessage type="success">{success}</StatusMessage>
      </div>

      {loading ? (
        <div className="content-loader"><div className="loader" /><p>Загружаем оплаты...</p></div>
      ) : loadError ? (
        <section className="payments-error-state"><span><UiIcon name="warning" size={30} /></span><h2>Не удалось загрузить оплаты</h2><p>Проверьте подключение и попробуйте выбрать месяц ещё раз.</p></section>
      ) : filteredPayments.length ? (
        <section className="payments-history-card">
          <div className="payments-history-heading"><div><p className="eyebrow">Фактические данные</p><h2>История оплат</h2></div><span>{filteredPayments.length} записей</span></div>
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
                  <td><span className={payment.currency === 'USD' ? 'payment-currency payment-currency--usd' : 'payment-currency'}>{payment.currency}</span></td>
                  <td className="lesson-note">{payment.note || '—'}</td>
                  <td><div className="table-actions"><button disabled={busy} onClick={() => openEditForm(payment)} type="button">Редактировать</button><button className="delete-link" disabled={busy} onClick={() => setPaymentToDelete(payment)} type="button">Удалить</button></div></td>
                </tr>
              )
            })}</tbody>
          </table>
          </div>
        </section>
      ) : (
        <section className="payments-empty-state"><img alt="Сова рядом с пустым кошельком" src="/payments/payments_empty_state.png" /><div><h2>Оплат за этот месяц нет</h2><p>Добавьте оплату или выберите другой месяц.</p>{students.length > 0 && <button className="primary-button" onClick={openCreateForm} type="button">+ Добавить оплату</button>}</div></section>
      )}

      {formOpen && <PaymentFormDialog error={formError} onClose={() => !busy && setFormOpen(false)} onSave={handleSave} payment={editingPayment} saving={busy} students={students} />}
      {paymentToDelete && <DeletePaymentDialog onCancel={() => !busy && setPaymentToDelete(null)} onConfirm={handleDelete} saving={busy} />}
    </div>
  )
}
