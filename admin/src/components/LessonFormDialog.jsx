import { useMemo, useState } from 'react'
import { calculateLessonCoins } from '../firebase/lessons.js'
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

export default function LessonFormDialog({ lesson, students, saving, error, onClose, onSave }) {
  const initialParts = useMemo(() => inputDateParts(lesson?.date), [lesson])
  const [studentId, setStudentId] = useState(lesson?.studentId || students[0]?.id || '')
  const [date, setDate] = useState(initialParts.date)
  const [time, setTime] = useState(initialParts.time)
  const [attended, setAttended] = useState(lesson?.attended ?? true)
  const [homework, setHomework] = useState(lesson?.homework ?? false)
  const [activity, setActivity] = useState(lesson?.activity ?? false)
  const [note, setNote] = useState(lesson?.note || '')
  const coins = calculateLessonCoins({ attended, homework, activity })

  const selectableStudents = students.filter(
    (student) => student.active || student.id === lesson?.studentId,
  )

  function handleSubmit(event) {
    event.preventDefault()
    const lessonDate = new Date(`${date}T${time}:00`)
    if (!studentId || Number.isNaN(lessonDate.getTime())) return

    onSave({ studentId, date: lessonDate, attended, homework, activity, note })
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose()
    }}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="lesson-form-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">Урок и прогресс</p>
            <h2 id="lesson-form-title">{lesson ? 'Редактировать урок' : 'Добавить урок'}</h2>
          </div>
          <button className="icon-button" disabled={saving} onClick={onClose} type="button" aria-label="Закрыть">×</button>
        </div>

        <form className="lesson-form" onSubmit={handleSubmit}>
          <label className="form-field form-field--wide">
            Ученик
            <select required value={studentId} onChange={(event) => setStudentId(event.target.value)}>
              <option value="" disabled>Выберите ученика</option>
              {selectableStudents.map((student) => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            Дата
            <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="form-field">
            Время
            <input required type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </label>

          <fieldset className="lesson-checks form-field--wide">
            <legend>Результаты урока</legend>
            <label><input checked={attended} onChange={(event) => setAttended(event.target.checked)} type="checkbox" /><img alt="" src="/lessons/lessons_icon_attendance.png" /><span>Посещение</span><strong>+5</strong></label>
            <label><input checked={homework} onChange={(event) => setHomework(event.target.checked)} type="checkbox" /><img alt="" src="/lessons/lessons_icon_homework.png" /><span>Домашнее задание</span><strong>+5</strong></label>
            <label><input checked={activity} onChange={(event) => setActivity(event.target.checked)} type="checkbox" /><img alt="" src="/lessons/lessons_icon_activity.png" /><span>Активность</span><strong>+5</strong></label>
          </fieldset>

          <div className="coin-preview form-field--wide">
            <span>Будет начислено</span><strong><img alt="" src="/lessons/lessons_icon_coins.png" />{coins}</strong>
          </div>

          <label className="form-field form-field--wide">
            Заметка
            <textarea maxLength="500" rows="3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Необязательно" />
          </label>

          <div className="form-field--wide"><StatusMessage>{error}</StatusMessage></div>
          <div className="dialog-actions form-field--wide">
            <button className="secondary-button" disabled={saving} onClick={onClose} type="button">Отмена</button>
            <button className="primary-button" disabled={saving || !studentId} type="submit">
              {saving ? 'Сохраняем…' : lesson ? 'Сохранить изменения' : 'Сохранить урок'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
