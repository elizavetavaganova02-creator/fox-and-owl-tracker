import { useMemo, useState } from 'react'
import StatusMessage from './StatusMessage.jsx'
import { CoinIcon } from './UiIcon.jsx'

const operationTypes = [
  { value: 'bonus', label: 'Бонус' },
  { value: 'adjustment', label: 'Корректировка' },
  { value: 'reward', label: 'Награда / списание' },
]

export default function CoinOperationDialog({ students, saving, error, onClose, onSave }) {
  const [studentId, setStudentId] = useState(students[0]?.id || '')
  const [type, setType] = useState('bonus')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId),
    [students, studentId],
  )
  const numericAmount = Number(amount)
  const validSign = type === 'bonus'
    ? numericAmount > 0
    : type === 'reward'
      ? numericAmount < 0
      : numericAmount !== 0

  function handleSubmit(event) {
    event.preventDefault()
    if (studentId && Number.isFinite(numericAmount) && validSign) {
      onSave({ studentId, type, amount: numericAmount, description })
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose()
    }}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="coin-operation-title">
        <div className="dialog-heading">
          <div><p className="eyebrow">Ручное изменение</p><h2 id="coin-operation-title">Операция с монетами</h2></div>
          <button className="icon-button" disabled={saving} onClick={onClose} type="button" aria-label="Закрыть">×</button>
        </div>
        <form className="coin-operation-form" onSubmit={handleSubmit}>
          <label className="form-field form-field--wide">Ученик<select required value={studentId} onChange={(event) => setStudentId(event.target.value)}><option value="" disabled>Выберите ученика</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
          {selectedStudent && <div className="current-balance form-field--wide"><span>Текущий баланс</span><strong className="inline-coin"><CoinIcon size={19} />{selectedStudent.coinsBalance ?? 0}</strong></div>}
          <label className="form-field">Тип операции<select value={type} onChange={(event) => { setType(event.target.value); setAmount('') }}>{operationTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="form-field">Сумма<input required step="1" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={type === 'reward' ? '-10' : type === 'bonus' ? '10' : '10 или -10'} /></label>
          <p className="amount-hint form-field--wide">{type === 'bonus' ? 'Для бонуса укажите положительное число.' : type === 'reward' ? 'Для списания укажите отрицательное число.' : 'Корректировка может быть положительной или отрицательной, кроме нуля.'}</p>
          <label className="form-field form-field--wide">Описание<textarea maxLength="300" rows="3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Причина операции" /></label>
          <div className="form-field--wide"><StatusMessage>{error}</StatusMessage></div>
          <div className="dialog-actions form-field--wide"><button className="secondary-button" disabled={saving} onClick={onClose} type="button">Отмена</button><button className="primary-button" disabled={saving || !studentId || !Number.isFinite(numericAmount) || !validSign} type="submit">{saving ? 'Сохраняем...' : 'Выполнить операцию'}</button></div>
        </form>
      </section>
    </div>
  )
}
