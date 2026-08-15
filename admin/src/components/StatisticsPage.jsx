import { useEffect, useMemo, useState } from 'react'
import { getStatistics } from '../firebase/statistics.js'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js'
import { formatCurrency } from '../utils/currency.js'
import StatusMessage from './StatusMessage.jsx'

const periods = [
  { value: 'month', label: 'Этот месяц' },
  { value: 'previousMonth', label: 'Прошлый месяц' },
  { value: 'year', label: 'Этот год' },
]

function IncomeValues({ totals }) {
  const entries = Object.entries(totals || {})
  if (!entries.length) return '0'
  return entries.map(([currency, amount]) => (
    <span key={currency}>{entries.length > 1 ? `${currency}: ` : ''}{formatCurrency(amount, currency)}</span>
  ))
}

export default function StatisticsPage({ students }) {
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getStatistics(period)
      .then((result) => active && setData(result))
      .catch((loadError) => active && setError(getFirebaseErrorMessage(loadError, 'Не удалось загрузить статистику.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [period])

  const sortedStudents = useMemo(
    () => [...students].sort((first, second) => Number(second.active) - Number(first.active) || (first.sortOrder ?? 0) - (second.sortOrder ?? 0)),
    [students],
  )

  return (
    <>
      <header className="page-header">
        <div><p className="eyebrow">Аналитика</p><h1>Статистика</h1></div>
        <div className="period-tabs">{periods.map((item) => <button className={period === item.value ? 'period-tab period-tab--active' : 'period-tab'} key={item.value} onClick={() => setPeriod(item.value)} type="button">{item.label}</button>)}</div>
      </header>

      {loading ? <div className="content-loader"><div className="loader" /><p>Загружаем данные...</p></div> : error ? <StatusMessage>{error}</StatusMessage> : data && (
        <>
          <section className="statistics-grid">
            <article><span>Проведено уроков</span><strong>{data.totalLessons}</strong></article>
            <article><span>Посещено уроков</span><strong>{data.attendedLessons}</strong></article>
            <article><span>Пропущено уроков</span><strong>{data.missedLessons}</strong></article>
            <article><span>Начислено монет</span><strong>{data.coinsIssued}</strong></article>
            <article><span>Получено оплат</span><strong>{data.paymentCount}</strong></article>
            <article className="stat-income"><span>Доход</span><strong><IncomeValues totals={data.income} /></strong></article>
          </section>

          <section className="attendance-card"><div><span>Посещаемость</span><strong>{data.attendancePercent}%</strong></div><div className="attendance-track"><span style={{ width: `${data.attendancePercent}%` }} /></div><p>{data.attendedLessons} из {data.totalLessons} уроков посещено</p></section>

          <section className="dashboard-panel student-statistics-panel">
            <div className="section-heading"><div><p className="eyebrow">По studentId</p><h2>Статистика учеников</h2></div></div>
            <div className="lessons-table-wrap flat-table-wrap"><table className="lessons-table student-statistics-table"><thead><tr><th>Ученик</th><th>Уроки за период</th><th>Посещаемость</th><th>Всего уроков</th><th>Всего заработано</th><th>Баланс</th><th>Серия</th></tr></thead><tbody>
              {sortedStudents.map((student) => {
                const periodData = data.byStudent[student.id] || { lessons: 0, attended: 0 }
                const attendance = periodData.lessons ? Math.round((periodData.attended / periodData.lessons) * 100) : 0
                return <tr key={student.id}><td><strong>{student.name}</strong>{!student.active && <small className="hidden-student-label">Скрыт</small>}</td><td>{periodData.lessons}</td><td>{attendance}%</td><td>{student.lessonsCompleted ?? 0}</td><td>{student.coinsEarnedTotal ?? 0}</td><td>{student.coinsBalance ?? 0}</td><td>{student.streak ?? 0}</td></tr>
              })}
            </tbody></table></div>
          </section>
        </>
      )}
    </>
  )
}
