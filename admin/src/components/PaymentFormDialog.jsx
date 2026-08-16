import { useMemo, useState } from 'react'
import StatusMessage from './StatusMessage.jsx'

function inputDateParts(timestamp) {
  const value = timestamp?.toDate ? timestamp.toDate() : new Date()
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
}

export default function PaymentFormDialog({ payment, students, saving, error, onClose, onSave }) {
  const initialParts = useMemo(() => inputDateParts(payment?.paidAt), [payment])
  const [studentId, setStudentId] = useState(payment?.studentId || students[0]?.id || '')
  const [amount, setAmount] = useState(payment?.amount ?? '')
  const [currency, setCurrency] = useState(payment?.currency || 'RUB')
  const [date, setDate] = useState(initialParts.date)
  const [time, setTime] = useState(initialParts.time)
  const [note, setNote] = useState(payment?.note || '')

  function handleSubmit(event) {
    event.preventDefault()
    const paidAt = new Date(`${date}T${time || '00:00'}:00`)
    onSave({ studentId, amount, currency, paidAt, note })
  }

  const validAmount = Number(amount) > 0

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose()
    }}>
      <section className="dialog payment-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-form-title">
        <div className="dialog-heading">
          <div><p className="eyebrow">Учёт дохода</p><h2 id="payment-form-title">{payment ? 'Редактировать оплату' : 'Добавить оплату'}</h2></div>
          <button className="icon-button" disabled={saving} onClick={onClose} type="button" aria-label="Закрыть">×</button>
        </div>

        <form className="payment-form" onSubmit={handleSubmit}>
          <label className="form-field form-field--wide">
            Ученик
            <select required value={studentId} onChange={(event) => setStudentId(event.target.value)}>
              <option value="" disabled>Выберите ученика</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            Сумма
            <input min="0.01" required step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <label className="form-field">
            Валюта
            <select required value={currency} onChange={(event) => setCurrency(event.target.value)}>
              <option value="RUB">RUB — Российский рубль</option>
              <option value="USD">USD — Доллар США</option>
            </select>
          </label>
          <label className="form-field">
            Дата
            <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="form-field">
            Время
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
          <label className="form-field form-field--wide">
            Комментарий
            <textarea maxLength="500" rows="3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Необязательно" />
          </label>
          <div className="form-field--wide"><StatusMessage>{error}</StatusMessage></div>
          <div className="dialog-actions form-field--wide">
            <button className="secondary-button" disabled={saving} onClick={onClose} type="button">Отмена</button>
            <button className="primary-button" disabled={saving || !studentId || !validAmount || !currency || !date} type="submit">
              {saving ? 'Сохраняем...' : payment ? 'Сохранить изменения' : 'Добавить оплату'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
