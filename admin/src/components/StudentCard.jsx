import { AnimalAvatar } from './UiIcon.jsx'

export default function StudentCard({ student, busy, onEdit, onToggleActive }) {
  return (
    <article className="student-card">
      <div className="student-avatar" aria-hidden="true">
        <AnimalAvatar id={student.avatar} />
      </div>
      <div className="student-name-row">
        <h3>{student.name}</h3>
        <span className={student.active ? 'active-badge' : 'inactive-badge'}>
          {student.active ? 'Активен' : 'Скрыт'}
        </span>
      </div>
      <dl className="student-stats">
        <div><dt>Монеты</dt><dd>{student.coinsBalance ?? 0}</dd></div>
        <div><dt>Всего заработано</dt><dd>{student.coinsEarnedTotal ?? 0}</dd></div>
        <div><dt>Уроки</dt><dd>{student.lessonsCompleted ?? 0}</dd></div>
        <div><dt>Серия</dt><dd>{student.streak ?? 0}</dd></div>
      </dl>
      <div className="student-actions">
        <button className="secondary-button" disabled={busy} onClick={() => onEdit(student)} type="button">
          Редактировать
        </button>
        <button
          className={student.active ? 'text-button text-button--danger' : 'text-button'}
          disabled={busy}
          onClick={() => onToggleActive(student)}
          type="button"
        >
          {student.active ? 'Скрыть' : 'Активировать'}
        </button>
      </div>
    </article>
  )
}
