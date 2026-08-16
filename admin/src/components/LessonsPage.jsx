import { useCallback, useEffect, useMemo, useState } from 'react'
import { createLesson, deleteLesson, getLessons, updateLesson } from '../firebase/lessons.js'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js'
import DeleteLessonDialog from './DeleteLessonDialog.jsx'
import LessonFormDialog from './LessonFormDialog.jsx'
import StatusMessage from './StatusMessage.jsx'

function formatLessonDate(timestamp) {
  if (!timestamp?.toDate) return { date: '—', time: '—' }
  const value = timestamp.toDate()
  return {
    date: new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(value),
    time: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(value),
  }
}

function CheckMark({ value }) {
  return <span className={value ? 'check-mark check-mark--yes' : 'check-mark'}>{value ? 'Да' : 'Нет'}</span>
}

export default function LessonsPage({ students, onStudentsChanged }) {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formError, setFormError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [lessonToDelete, setLessonToDelete] = useState(null)

  const studentNames = useMemo(
    () => Object.fromEntries(students.map((student) => [student.id, student.name])),
    [students],
  )

  const loadLessons = useCallback(async () => {
    const items = await getLessons()
    setLessons(items)
  }, [])

  useEffect(() => {
    let active = true
    getLessons()
      .then((items) => active && setLessons(items))
      .catch((loadError) => active && setError(getFirebaseErrorMessage(loadError, 'Не удалось загрузить уроки.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  function openCreateForm() {
    setEditingLesson(null)
    setFormError('')
    setFormOpen(true)
  }

  function openEditForm(lesson) {
    setEditingLesson(lesson)
    setFormError('')
    setFormOpen(true)
  }

  async function handleSave(values) {
    setBusy(true)
    setError('')
    setSuccess('')
    setFormError('')
    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, values)
        setSuccess('Изменения урока сохранены')
      } else {
        await createLesson(values)
        setSuccess('Урок сохранён, монеты начислены')
      }
      await Promise.all([loadLessons(), onStudentsChanged()])
      setFormOpen(false)
    } catch (saveError) {
      setFormError(getFirebaseErrorMessage(saveError, 'Не удалось сохранить урок.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(lesson) {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await deleteLesson(lesson.id)
      await Promise.all([loadLessons(), onStudentsChanged()])
      setLessonToDelete(null)
      setSuccess('Урок удалён, показатели ученика пересчитаны')
    } catch (deleteError) {
      setError(getFirebaseErrorMessage(deleteError, 'Не удалось удалить урок.'))
    } finally {
      setBusy(false)
    }
  }

  const activeStudents = students.filter((student) => student.active)
  const attendedLessons = lessons.filter((lesson) => lesson.attended).length
  const missedLessons = lessons.filter((lesson) => !lesson.attended).length
  const issuedCoins = lessons.reduce((total, lesson) => total + Number(lesson.coins || 0), 0)

  return (
    <div className="lessons-page">
      <header className="page-header lessons-header">
        <div><p className="eyebrow">История занятий</p><h1>Уроки</h1><span>Посещаемость, результаты и начисленные монеты</span></div>
        <button className="primary-button add-student-button" disabled={!activeStudents.length} onClick={openCreateForm} type="button">
          + Добавить урок
        </button>
      </header>

      <section className="lessons-overview" aria-label="Краткая статистика уроков">
        <article><img alt="" src="/lessons/lessons_icon_lesson.png" /><div><span>Всего уроков</span><strong>{lessons.length}</strong></div></article>
        <article><img alt="" src="/lessons/lessons_icon_attendance.png" /><div><span>Посещено</span><strong>{attendedLessons}</strong></div></article>
        <article><img alt="" src="/lessons/lessons_icon_missed.png" /><div><span>Пропущено</span><strong>{missedLessons}</strong></div></article>
        <article><img alt="" src="/lessons/lessons_icon_coins.png" /><div><span>Монет начислено</span><strong>{issuedCoins}</strong></div></article>
      </section>

      <section className="lessons-support-card">
        <img alt="Лиса и сова учатся вместе" src="/lessons/lessons_header_fox_owl.png" />
        <div><p className="eyebrow">Fox & Owl</p><h2>Каждый урок — ещё один шаг вперёд</h2><span>Посещаемость, домашние задания и активность собраны в одном месте.</span></div>
      </section>

      <div className="page-messages" aria-live="polite">
        <StatusMessage>{error}</StatusMessage>
        <StatusMessage type="success">{success}</StatusMessage>
      </div>

      {loading ? (
        <div className="content-loader"><div className="loader" /><p>Загрузка уроков...</p></div>
      ) : lessons.length ? (
        <section className="lessons-history-card">
          <div className="lessons-history-heading"><div><p className="eyebrow">Фактические данные</p><h2>История уроков</h2></div><span>{lessons.length} записей</span></div>
          <div className="lessons-table-wrap">
          <table className="lessons-table">
            <thead><tr><th>Дата и время</th><th>Ученик</th><th>Посещение</th><th>ДЗ</th><th>Активность</th><th>Монеты</th><th>Заметка</th><th aria-label="Действия" /></tr></thead>
            <tbody>
              {lessons.map((lesson) => {
                const lessonDate = formatLessonDate(lesson.date)
                return (
                  <tr key={lesson.id}>
                    <td><strong>{lessonDate.date}</strong><small>{lessonDate.time}</small></td>
                    <td>{studentNames[lesson.studentId] || 'Неизвестный ученик'}</td>
                    <td><CheckMark value={lesson.attended} /></td>
                    <td><CheckMark value={lesson.homework} /></td>
                    <td><CheckMark value={lesson.activity} /></td>
                    <td><strong className="coins-value"><img alt="" src="/lessons/lessons_icon_coins.png" />+{lesson.coins ?? 0}</strong></td>
                    <td className="lesson-note">{lesson.note || '—'}</td>
                    <td><div className="table-actions"><button disabled={busy} onClick={() => openEditForm(lesson)} type="button">Редактировать</button><button className="delete-link" disabled={busy} onClick={() => setLessonToDelete(lesson)} type="button">Удалить</button></div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </section>
      ) : (
        <section className="lessons-empty-state"><img alt="Лиса и сова отдыхают после занятий" src="/lessons/lessons_empty_state.png" /><div><h2>Уроков пока нет</h2><p>Добавьте первый урок, и он появится в истории.</p>{activeStudents.length > 0 && <button className="primary-button" onClick={openCreateForm} type="button">+ Добавить урок</button>}</div></section>
      )}

      {formOpen && (
        <LessonFormDialog
          error={formError}
          lesson={editingLesson}
          onClose={() => !busy && setFormOpen(false)}
          onSave={handleSave}
          saving={busy}
          students={editingLesson ? students : activeStudents}
        />
      )}
      {lessonToDelete && <DeleteLessonDialog lesson={lessonToDelete} saving={busy} onCancel={() => !busy && setLessonToDelete(null)} onConfirm={handleDelete} />}
    </div>
  )
}
