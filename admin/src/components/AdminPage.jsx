import { useCallback, useEffect, useState } from 'react'
import { logoutAdmin } from '../firebase/auth.js'
import { addStudent, getStudents, setStudentActive, updateStudent } from '../firebase/students.js'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import CoinsPage from './CoinsPage.jsx'
import LessonsPage from './LessonsPage.jsx'
import PaymentsPage from './PaymentsPage.jsx'
import StatisticsPage from './StatisticsPage.jsx'
import StatusMessage from './StatusMessage.jsx'
import StudentCard from './StudentCard.jsx'
import StudentFormDialog from './StudentFormDialog.jsx'
import TodayPage from './TodayPage.jsx'
import { AnimalAvatar, BrandMark, UiIcon } from './UiIcon.jsx'

const navigation = [
  { label: 'Сегодня', section: 'today', icon: 'today' },
  { label: 'Ученики', section: 'students', icon: 'students' },
  { label: 'Уроки', section: 'lessons', icon: 'lessons' },
  { label: 'Оплаты', section: 'payments', icon: 'payments' },
  { label: 'Монеты', section: 'coins', icon: 'coins' },
  { label: 'Статистика', section: 'statistics', icon: 'statistics' },
]

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('today')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formStudent, setFormStudent] = useState(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [studentToHide, setStudentToHide] = useState(null)

  const loadStudents = useCallback(async () => {
    const items = await getStudents()
    setStudents(items)
  }, [])

  useEffect(() => {
    let active = true
    getStudents()
      .then((items) => active && setStudents(items))
      .catch((loadError) => {
        if (active) setError(getFirebaseErrorMessage(loadError, 'Не удалось загрузить учеников.'))
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  function openCreateForm() {
    setFormStudent(undefined)
    setFormError('')
    setFormOpen(true)
  }

  function openEditForm(student) {
    setFormStudent(student)
    setFormError('')
    setFormOpen(true)
  }

  async function handleSaveStudent(values) {
    setBusy(true)
    setFormError('')
    setError('')
    setSuccess('')
    try {
      if (formStudent) {
        await updateStudent(formStudent.id, values)
        await loadStudents()
        setSuccess('Изменения сохранены')
      } else {
        await addStudent(values)
        await loadStudents()
        setSuccess('Ученик добавлен')
      }
      setFormOpen(false)
    } catch (saveError) {
      setFormError(getFirebaseErrorMessage(saveError, 'Не удалось сохранить ученика.'))
    } finally {
      setBusy(false)
    }
  }

  function requestToggleActive(student) {
    if (student.active) setStudentToHide(student)
    else handleToggleActive(student)
  }

  async function handleToggleActive(student) {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      await setStudentActive(student.id, !student.active)
      await loadStudents()
      setSuccess(student.active ? 'Ученик скрыт' : 'Ученик активирован')
      setStudentToHide(null)
    } catch (updateError) {
      setError(getFirebaseErrorMessage(updateError, 'Не удалось изменить статус ученика.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand"><BrandMark compact /><div><strong>Лиса и Сова</strong><small>FOX & OWL</small></div></div>
        <nav aria-label="Основная навигация">
          {navigation.map((item) => (
            <button
              className={item.section === activeSection ? 'nav-button nav-button--active' : 'nav-button'}
              disabled={!item.section}
              key={item.label}
              onClick={() => item.section && setActiveSection(item.section)}
              type="button"
            >
              <UiIcon name={item.icon} /> <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-tip"><UiIcon name="lessons" /><p><strong>Маленькие шаги</strong><span>Каждый урок приближает ученика к цели.</span></p></div>
        <button className="logout-button" onClick={logoutAdmin} type="button"><UiIcon name="logout" /> <span>Выйти</span></button>
      </aside>

      <main className="main-area"><div className="topbar"><span>Панель учителя</span><div className="admin-profile"><button aria-label="Уведомления" type="button"><UiIcon name="bell" /></button><span className="admin-avatar">ЛС</span><p><strong>Администратор</strong><small>Лиса и Сова</small></p></div></div><div className="content">
        {activeSection === 'today' ? (
          loading ? (
            <div className="content-loader"><div className="loader" /><p>Загружаем данные...</p></div>
          ) : error ? (
            <StatusMessage>{error}</StatusMessage>
          ) : (
            <TodayPage onNavigate={setActiveSection} students={students} />
          )
        ) : activeSection === 'lessons' ? (
          <LessonsPage onStudentsChanged={loadStudents} students={students} />
        ) : activeSection === 'payments' ? (
          <PaymentsPage students={students} />
        ) : activeSection === 'coins' ? (
          <CoinsPage onStudentsChanged={loadStudents} students={students} />
        ) : activeSection === 'statistics' ? (
          loading ? (
            <div className="content-loader"><div className="loader" /><p>Загружаем данные...</p></div>
          ) : error ? (
            <StatusMessage>{error}</StatusMessage>
          ) : (
            <StatisticsPage students={students} />
          )
        ) : (
          <>
            <header className="page-header">
              <div><p className="eyebrow">Управление группой</p><h1>Ученики</h1></div>
              <div className="page-header-actions">
                <span className="student-count">Всего: {students.length}</span>
                <button className="primary-button add-student-button" onClick={openCreateForm} type="button">+ Добавить ученика</button>
              </div>
            </header>

            <div className="page-messages" aria-live="polite">
              <StatusMessage>{error}</StatusMessage>
              <StatusMessage type="success">{success}</StatusMessage>
            </div>

            {loading ? (
              <div className="content-loader"><div className="loader" /><p>Загрузка учеников...</p></div>
            ) : students.length > 0 ? (
              <section className="student-grid" aria-label="Список учеников">
                {students.map((student) => (
                  <StudentCard busy={busy} key={student.id} onEdit={openEditForm} onToggleActive={requestToggleActive} student={student} />
                ))}
              </section>
            ) : (
              <section className="empty-state"><span className="empty-icon"><AnimalAvatar id="owl" /></span><h2>Учеников пока нет</h2><p>Добавьте первого ученика, чтобы начать работу.</p></section>
            )}
          </>
        )}
      </div></main>

      {formOpen && <StudentFormDialog error={formError} onClose={() => !busy && setFormOpen(false)} onSave={handleSaveStudent} saving={busy} student={formStudent} />}
      {studentToHide && <ConfirmDialog onCancel={() => !busy && setStudentToHide(null)} onConfirm={() => handleToggleActive(studentToHide)} saving={busy} student={studentToHide} />}
    </div>
  )
}
