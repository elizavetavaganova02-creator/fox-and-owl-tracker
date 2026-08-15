import { useEffect, useMemo, useState } from 'react'
import { createManualCoinOperation, getCoinTransactions } from '../firebase/coins.js'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js'
import CoinOperationDialog from './CoinOperationDialog.jsx'
import StatusMessage from './StatusMessage.jsx'
import { CoinIcon, UiIcon } from './UiIcon.jsx'

const typeLabels = {
  lesson: 'Урок',
  bonus: 'Бонус',
  adjustment: 'Корректировка',
  reward: 'Награда / списание',
}

function formatDateTime(timestamp) {
  if (!timestamp?.toDate) return { date: '—', time: '—' }
  const value = timestamp.toDate()
  return {
    date: new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(value),
    time: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(value),
  }
}

export default function CoinsPage({ students, onStudentsChanged }) {
  const [transactions, setTransactions] = useState([])
  const [studentFilter, setStudentFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  async function loadTransactions() {
    const items = await getCoinTransactions()
    setTransactions(items)
  }

  useEffect(() => {
    let active = true
    getCoinTransactions()
      .then((items) => active && setTransactions(items))
      .catch((loadError) => active && setError(getFirebaseErrorMessage(loadError, 'Не удалось загрузить операции.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const studentNames = useMemo(
    () => Object.fromEntries(students.map((student) => [student.id, student.name])),
    [students],
  )
  const sortedStudents = useMemo(
    () => [...students].sort((first, second) => Number(second.active) - Number(first.active) || (first.sortOrder ?? 0) - (second.sortOrder ?? 0)),
    [students],
  )
  const totalActiveBalance = students
    .filter((student) => student.active)
    .reduce((total, student) => total + (Number(student.coinsBalance) || 0), 0)
  const filteredTransactions = transactions.filter((transaction) => (
    (studentFilter === 'all' || transaction.studentId === studentFilter)
    && (typeFilter === 'all' || transaction.type === typeFilter)
  ))

  async function handleOperation(values) {
    setBusy(true)
    setError('')
    setFormError('')
    setSuccess('')
    try {
      await createManualCoinOperation(values)
      await Promise.all([loadTransactions(), onStudentsChanged()])
      setFormOpen(false)
      setSuccess(values.amount > 0 ? 'Монеты начислены' : 'Монеты списаны')
    } catch (operationError) {
      setFormError(getFirebaseErrorMessage(operationError, 'Не удалось выполнить операцию.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <header className="page-header">
        <div><p className="eyebrow">Баланс и история</p><h1>Монеты</h1></div>
        <button className="primary-button add-student-button" disabled={!students.length} onClick={() => { setFormError(''); setFormOpen(true) }} type="button">+ Операция с монетами</button>
      </header>

      <section className="coins-overview">
        <article className="total-coins-card"><span className="kpi-icon kpi-icon--gold"><CoinIcon /></span><p>Монет на балансах активных учеников</p><strong>{totalActiveBalance}</strong></article>
        <div className="balance-strip">{sortedStudents.map((student) => <article className={!student.active ? 'balance-chip balance-chip--inactive' : 'balance-chip'} key={student.id}><span>{student.name}</span><strong>{student.coinsBalance ?? 0}</strong></article>)}</div>
      </section>

      <div className="coin-filters">
        <label>Ученик<select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}><option value="all">Все ученики</option>{sortedStudents.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
        <label>Тип<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Все операции</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>

      <div className="page-messages" aria-live="polite"><StatusMessage>{error}</StatusMessage><StatusMessage type="success">{success}</StatusMessage></div>

      <section className="history-section">
        <div className="section-heading"><div><p className="eyebrow">Все изменения</p><h2>История операций</h2></div></div>
        {loading ? (
          <div className="content-loader"><div className="loader" /><p>Загружаем операции...</p></div>
        ) : error ? (
          <div className="empty-state empty-state--error"><span className="empty-icon"><UiIcon name="warning" /></span><h2>Не удалось загрузить операции</h2><p>Проверьте подключение и попробуйте открыть страницу снова.</p></div>
        ) : filteredTransactions.length ? (
          <div className="lessons-table-wrap"><table className="lessons-table coin-history-table"><thead><tr><th>Дата и время</th><th>Ученик</th><th>Сумма</th><th>Тип</th><th>Описание</th></tr></thead><tbody>{filteredTransactions.map((transaction) => {
            const createdAt = formatDateTime(transaction.createdAt)
            return <tr key={transaction.id}><td><strong>{createdAt.date}</strong><small>{createdAt.time}</small></td><td>{studentNames[transaction.studentId] || 'Неизвестный ученик'}</td><td><strong className={transaction.amount >= 0 ? 'coin-amount coin-amount--positive' : 'coin-amount coin-amount--negative'}>{transaction.amount > 0 ? '+' : ''}{transaction.amount}</strong></td><td><span className={`transaction-type transaction-type--${transaction.type}`}>{typeLabels[transaction.type] || transaction.type || '—'}</span></td><td className="lesson-note">{transaction.description || '—'}</td></tr>
          })}</tbody></table></div>
        ) : <div className="empty-state"><span className="empty-icon"><CoinIcon size={34} /></span><h2>Операций не найдено</h2><p>Измените фильтры или создайте ручную операцию.</p></div>}
      </section>

      {formOpen && <CoinOperationDialog error={formError} onClose={() => !busy && setFormOpen(false)} onSave={handleOperation} saving={busy} students={sortedStudents} />}
    </>
  )
}
