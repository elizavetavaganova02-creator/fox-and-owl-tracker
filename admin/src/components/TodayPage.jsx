import { useEffect, useMemo, useState } from 'react'
import { getTodayDashboard } from '../firebase/statistics.js'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js'
import { formatCurrency } from '../utils/currency.js'
import StatusMessage from './StatusMessage.jsx'
import { CoinIcon, UiIcon } from './UiIcon.jsx'

function formatTime(timestamp) {
  if (!timestamp?.toDate) return '—'
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(timestamp.toDate())
}

function CurrencyValues({ totals }) {
  const entries = Object.entries(totals || {})
  if (!entries.length) return <strong>0</strong>
  return entries.map(([currency, amount]) => (
    <strong key={currency}>{entries.length > 1 ? `${currency}: ` : ''}{formatCurrency(amount, currency)}</strong>
  ))
}

function ResultMark({ value }) {
  return <span className={value ? 'check-mark check-mark--yes' : 'check-mark'}>{value ? 'Да' : 'Нет'}</span>
}

export default function TodayPage({ students, onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const studentNames = useMemo(
    () => Object.fromEntries(students.map((student) => [student.id, student.name])),
    [students],
  )

  useEffect(() => {
    let active = true
    getTodayDashboard()
      .then((result) => active && setData(result))
      .catch((loadError) => active && setError(getFirebaseErrorMessage(loadError, 'Не удалось загрузить данные.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  if (loading) return <div className="content-loader"><div className="loader" /><p>Загружаем данные...</p></div>
  if (error) return <StatusMessage>{error}</StatusMessage>

  const activeStudents = students.filter((student) => student.active).length

  return (
    <>
      <header className="page-header dashboard-header">
        <div><p className="eyebrow">Обзор дня</p><h1>Сегодня</h1><span>{new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span></div>
        <div className="active-students-card"><span>Активные ученики</span><strong>{activeStudents}</strong><small>Всего: {students.length}</small></div>
      </header>

      <section className="summary-grid">
        <article className="summary-card"><span className="kpi-icon kpi-icon--blue"><UiIcon name="lessons" /></span><p>Уроков сегодня</p><strong>{data.totalLessons}</strong><small>Записано за день</small></article>
        <article className="summary-card"><span className="kpi-icon kpi-icon--gold"><CoinIcon /></span><p>Монет начислено сегодня</p><strong>{data.coinsIssued}</strong><small>По результатам уроков</small></article>
        <article className="summary-card"><span className="kpi-icon kpi-icon--green"><UiIcon name="receipt" /></span><p>Оплат сегодня</p><strong>{data.paymentCount}</strong><small>Поступлений за день</small></article>
        <article className="summary-card summary-card--income"><span className="kpi-icon kpi-icon--peach"><UiIcon name="income" /></span><p>Доход сегодня</p><div className="summary-currencies"><CurrencyValues totals={data.income} /></div><small>По фактическим оплатам</small></article>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-panel">
          <div className="section-heading"><div><p className="eyebrow">Фактические данные</p><h2>Сегодняшние уроки</h2></div><button onClick={() => onNavigate('lessons')} type="button">Перейти к урокам</button></div>
          {data.lessons.length ? (
            <div className="compact-list">
              {data.lessons.map((lesson) => (
                <article key={lesson.id}>
                  <time>{formatTime(lesson.date)}</time>
                  <div><strong>{studentNames[lesson.studentId] || 'Неизвестный ученик'}</strong><p>{lesson.note || 'Без заметки'}</p></div>
                  <div className="compact-marks"><ResultMark value={lesson.attended} /><ResultMark value={lesson.homework} /><ResultMark value={lesson.activity} /></div>
                  <b className="inline-coin"><CoinIcon size={18} />+{lesson.coins || 0}</b>
                </article>
              ))}
            </div>
          ) : <p className="panel-empty">Сегодня уроков пока нет</p>}
        </section>

        <section className="dashboard-panel">
          <div className="section-heading"><div><p className="eyebrow">Поступления</p><h2>Оплаты сегодня</h2></div><button onClick={() => onNavigate('payments')} type="button">Перейти к оплатам</button></div>
          {data.payments.length ? (
            <div className="compact-list compact-list--payments">
              {data.payments.map((payment) => (
                <article key={payment.id}>
                  <time>{formatTime(payment.paidAt)}</time>
                  <div><strong>{studentNames[payment.studentId] || 'Неизвестный ученик'}</strong><p>{payment.note || 'Без комментария'}</p></div>
                  <b>{formatCurrency(payment.amount, payment.currency)}</b>
                </article>
              ))}
            </div>
          ) : <p className="panel-empty">Сегодня оплат пока нет</p>}
        </section>
      </div>
    </>
  )
}
