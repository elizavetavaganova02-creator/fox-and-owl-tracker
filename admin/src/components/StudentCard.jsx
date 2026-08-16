import { AnimalAvatar, CoinIcon } from './UiIcon.jsx'
import { avatars } from '../constants/avatars.js'

const pngAvatars = new Set(['fox', 'owl', 'panda', 'rabbit', 'cat', 'dog', 'penguin', 'bear', 'hedgehog', 'raccoon', 'elephant'])

function StudentAvatar({ id }) {
  const source = avatars[id]?.src || (pngAvatars.has(id) ? `/students/students_avatar_${id}.png` : '')
  return source
    ? <img alt="" src={source} />
    : <AnimalAvatar id={id} />
}

export default function StudentCard({ student, busy, onEdit, onToggleActive }) {
  return (
    <article className={student.active ? 'student-card' : 'student-card student-card--hidden'}>
      <div className="student-avatar" aria-hidden="true">
        <StudentAvatar id={student.avatar} />
      </div>
      <div className="student-name-row">
        <h3>{student.name}</h3>
        <span className={student.active ? 'active-badge' : 'inactive-badge'}>
          {student.active ? 'Активен' : 'Скрыт'}
        </span>
      </div>
      <dl className="student-stats">
        <div><dt>Монеты</dt><dd className="student-coins"><CoinIcon size={18} />{student.coinsBalance ?? 0}</dd></div>
        <div><dt>Всего заработано</dt><dd>{student.coinsEarnedTotal ?? 0}</dd></div>
        <div><dt>Уроки</dt><dd>{student.lessonsCompleted ?? 0}</dd></div>
        <div><dt>Уроков подряд</dt><dd>{student.streak ?? 0}</dd></div>
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
