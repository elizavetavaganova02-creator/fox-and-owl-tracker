import { useEffect, useMemo, useState } from 'react'
import { getTodayDashboard } from '../firebase/statistics.js'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js'
import { formatCurrency } from '../utils/currency.js'
import StatusMessage from './StatusMessage.jsx'
import { CoinIcon } from './UiIcon.jsx'

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

function ResultMark({ value, label }) {
  return <span className={value ? 'today-status today-status--yes' : 'today-status'}>{label}: {value ? 'да' : 'нет'}</span>
}

function TodayIllustration({ className = '', label = '', src }) {
  return <span className={`today-illustration ${className}`}><img alt={label} src={src} /></span>
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
    <div className="today-page">
      <header className="today-header">
        <div className="today-heading">
          <p className="eyebrow">Обзор дня</p>
          <h1>Сегодня</h1>
          <span>{new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span>
        </div>
        <div className="today-active-card">
          <div><span>Активные ученики</span><small>Всего: {students.length}</small></div>
          <strong>{activeStudents}</strong>
        </div>
      </header>

      <section className="today-kpi-grid" aria-label="Показатели дня">
        <article className="today-kpi-card today-kpi-card--blue"><TodayIllustration className="today-kpi-icon" label="Уроки" src="/today/today_kpi_lessons.png" /><div><p>Уроков сегодня</p><strong>{data.totalLessons}</strong><small>Фактические занятия за день</small></div></article>
        <article className="today-kpi-card today-kpi-card--gold"><TodayIllustration className="today-kpi-icon" label="Монеты" src="/today/today_kpi_coins.png" /><div><p>Монет начислено сегодня</p><strong>{data.coinsIssued}</strong><small>Положительные начисления</small></div></article>
        <article className="today-kpi-card today-kpi-card--green"><TodayIllustration className="today-kpi-icon" label="Оплаты" src="/today/today_kpi_payments.png" /><div><p>Оплат сегодня</p><strong>{data.paymentCount}</strong><small>Поступления за текущий день</small></div></article>
        <article className="today-kpi-card today-kpi-card--peach"><TodayIllustration className="today-kpi-icon" label="Доход" src="/today/today_kpi_income.png" /><div><p>Доход сегодня</p><div className="today-kpi-currencies"><CurrencyValues totals={data.income} /></div><small>Без смешивания валют</small></div></article>
      </section>

      <section className="today-support-card">
        <div className="today-support-art"><TodayIllustration className="today-support-illustration" label="Лиса и сова" src="/today/today_support_fox_owl.png" /></div>
        <div><p className="eyebrow">Fox & Owl</p><h2>Всё важное за день — в одном месте</h2><span>Фактические уроки, начисления и поступления обновляются из вашей рабочей базы.</span></div>
        <div className="today-support-dot" aria-hidden="true" />
      </section>

      <div className="today-panels">
        <section className="today-panel">
          <div className="today-panel-heading"><div><p className="eyebrow">Фактические данные</p><h2>Сегодняшние уроки</h2></div><button onClick={() => onNavigate('lessons')} type="button">Перейти к урокам <span aria-hidden="true">→</span></button></div>
          {data.lessons.length ? (
            <div className="today-list today-list--lessons">
              {data.lessons.map((lesson) => (
                <article key={lesson.id}><time>{formatTime(lesson.date)}</time><div className="today-list-copy"><strong>{studentNames[lesson.studentId] || 'Неизвестный ученик'}</strong><p>{lesson.note || 'Без заметки'}</p></div><div className="today-statuses"><ResultMark label="П" value={lesson.attended} /><ResultMark label="ДЗ" value={lesson.homework} /><ResultMark label="А" value={lesson.activity} /></div><b className="inline-coin"><CoinIcon size={18} />+{lesson.coins || 0}</b></article>
              ))}
            </div>
          ) : (
            <div className="today-empty"><TodayIllustration className="today-empty-illustration" label="Сегодня уроков нет" src="/today/today_empty_lessons.png" /><div><h3>Сегодня уроков пока нет</h3><p>Когда появится урок, он будет отображаться здесь.</p></div></div>
          )}
        </section>

        <section className="today-panel">
          <div className="today-panel-heading"><div><p className="eyebrow">Поступления</p><h2>Оплаты сегодня</h2></div><button onClick={() => onNavigate('payments')} type="button">Перейти к оплатам <span aria-hidden="true">→</span></button></div>
          {data.payments.length ? (
            <div className="today-list today-list--payments">
              {data.payments.map((payment) => (
                <article key={payment.id}><time>{formatTime(payment.paidAt)}</time><div className="today-list-copy"><strong>{studentNames[payment.studentId] || 'Неизвестный ученик'}</strong><p>{payment.note || 'Без комментария'}</p></div><b>{formatCurrency(payment.amount, payment.currency)}</b></article>
              ))}
            </div>
          ) : (
            <div className="today-empty"><TodayIllustration className="today-empty-illustration" label="Сегодня оплат нет" src="/today/today_empty_payments.png" /><div><h3>Сегодня оплат пока нет</h3><p>Новые поступления появятся здесь.</p></div></div>
          )}
        </section>
      </div>
    </div>
  )
}
