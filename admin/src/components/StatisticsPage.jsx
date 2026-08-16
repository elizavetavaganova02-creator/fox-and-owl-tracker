import { useEffect, useMemo, useState } from 'react'
import { getStatistics } from '../firebase/statistics.js'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js'
import { formatCurrency } from '../utils/currency.js'

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

  const kpis = data ? [
    { label: 'Проведено уроков', value: data.totalLessons, image: '/statistics/statistics_icon_lessons.png', tone: 'violet' },
    { label: 'Посещено уроков', value: data.attendedLessons, image: '/statistics/statistics_icon_attended.png', tone: 'green' },
    { label: 'Пропущено уроков', value: data.missedLessons, image: '/statistics/statistics_icon_missed.png', tone: 'terracotta' },
    { label: 'Начислено монет', value: data.coinsIssued, image: '/statistics/statistics_icon_coins.png', tone: 'gold' },
    { label: 'Получено оплат', value: data.paymentCount, image: '/statistics/statistics_icon_payments.png', tone: 'blue' },
    { label: 'Доход', value: <IncomeValues totals={data.income} />, image: '/statistics/statistics_icon_income.png', tone: 'peach', income: true },
  ] : []

  const hasLowData = data && data.totalLessons === 0 && data.paymentCount === 0 && data.coinsIssued === 0

  return (
    <main className="statistics-page">
      <header className="statistics-header">
        <div className="statistics-title-block">
          <p className="eyebrow">АНАЛИТИКА</p>
          <h1>Статистика</h1>
          <p>Уроки, посещаемость, монеты и доход</p>
        </div>
        <div className="period-tabs" aria-label="Период статистики">
          {periods.map((item) => (
            <button className={period === item.value ? 'period-tab period-tab--active' : 'period-tab'} key={item.value} onClick={() => setPeriod(item.value)} type="button">
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="statistics-state statistics-loading"><div className="loader" /><p>Загружаем данные...</p></div>
      ) : error ? (
        <section className="statistics-state statistics-error" role="alert">
          <div className="statistics-error-mark">!</div>
          <div><h2>Не удалось загрузить статистику</h2><p>Проверьте подключение и попробуйте открыть страницу снова.</p><small>{error}</small></div>
        </section>
      ) : data && (
        <>
          <section className="statistics-grid" aria-label="Ключевые показатели">
            {kpis.map((kpi) => (
              <article className={`statistics-kpi statistics-kpi--${kpi.tone}`} key={kpi.label}>
                <div className="statistics-kpi-icon"><img src={kpi.image} alt="" /></div>
                <div><span>{kpi.label}</span><strong className={kpi.income ? 'statistics-kpi-income' : ''}>{kpi.value}</strong></div>
              </article>
            ))}
          </section>

          <section className="statistics-overview-row">
            <article className="statistics-support-card">
              <div className="statistics-support-copy"><p className="eyebrow">FOX &amp; OWL</p><h2>Прогресс становится заметнее в цифрах</h2><p>Следите за уроками, посещаемостью, монетами и оплатами за выбранный период.</p></div>
              <img className="statistics-support-image" src="/statistics/statistics_header_fox_owl.png" alt="Лиса и сова изучают статистику" />
            </article>

            <article className="statistics-attendance-card">
              <div className="statistics-attendance-head">
                <p className="eyebrow">ПОСЕЩАЕМОСТЬ</p>
                <div
                  className="statistics-attendance-ring"
                  style={{ '--attendance-percent': `${data.attendancePercent * 3.6}deg` }}
                  aria-label={`Посещаемость ${data.attendancePercent}%`}
                >
                  <strong>{data.attendancePercent}%</strong>
                </div>
              </div>
              <div className="attendance-track" aria-hidden="true"><span style={{ width: `${data.attendancePercent}%` }} /></div>
              <p>{data.totalLessons === 0 ? 'За выбранный период уроков пока нет' : `${data.attendedLessons} из ${data.totalLessons} уроков посещено`}</p>
            </article>
          </section>

          {hasLowData && (
            <section className="statistics-empty-card">
              <img src="/statistics/statistics_empty_state.png" alt="Сова рядом с аналитической карточкой" />
              <div><h2>За этот период данных пока немного</h2><p>Новые уроки, оплаты и начисления появятся в статистике автоматически.</p></div>
            </section>
          )}

          <section className="dashboard-panel student-statistics-panel">
            <div className="section-heading"><div><p className="eyebrow">ПО УЧЕНИКАМ</p><h2>Статистика учеников</h2></div></div>
            <div className="lessons-table-wrap flat-table-wrap"><table className="lessons-table student-statistics-table"><thead><tr><th>Ученик</th><th>Уроки за период</th><th>Посещаемость</th><th>Всего уроков</th><th>Всего заработано</th><th>Баланс</th><th>Уроков подряд</th></tr></thead><tbody>
              {sortedStudents.map((student) => {
                const periodData = data.byStudent[student.id] || { lessons: 0, attended: 0 }
                const attendance = periodData.lessons ? Math.round((periodData.attended / periodData.lessons) * 100) : 0
                return (
                  <tr className={!student.active ? 'student-statistics-row--hidden' : ''} key={student.id}>
                    <td><div className="statistics-student-name"><strong>{student.name}</strong>{!student.active && <small className="hidden-student-label">Скрыт</small>}</div></td>
                    <td>{periodData.lessons}</td>
                    <td><div className="student-attendance-value"><strong>{attendance}%</strong><span><i style={{ width: `${attendance}%` }} /></span></div></td>
                    <td>{student.lessonsCompleted ?? 0}</td>
                    <td><span className="statistics-coin-value"><img src="/statistics/statistics_icon_coins.png" alt="" />{student.coinsEarnedTotal ?? 0}</span></td>
                    <td><span className="statistics-coin-value"><img src="/statistics/statistics_icon_coins.png" alt="" />{student.coinsBalance ?? 0}</span></td>
                    <td>{student.streak ?? 0}</td>
                  </tr>
                )
              })}
            </tbody></table></div>
          </section>
        </>
      )}
    </main>
  )
}
