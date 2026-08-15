import { useEffect, useState } from 'react'
import { avatars } from '../constants/avatars.js'
import StatusMessage from './StatusMessage.jsx'
import { AnimalAvatar } from './UiIcon.jsx'

export default function StudentFormDialog({ student, saving, error, onClose, onSave }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('fox')

  useEffect(() => {
    setName(student?.name || '')
    setAvatar(student?.avatar || 'fox')
  }, [student])

  function handleSubmit(event) {
    event.preventDefault()
    const cleanName = name.trim()
    if (cleanName) onSave({ name: cleanName, avatar })
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose()
    }}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="student-form-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">Карточка ученика</p>
            <h2 id="student-form-title">{student ? 'Редактировать ученика' : 'Новый ученик'}</h2>
          </div>
          <button className="icon-button" disabled={saving} onClick={onClose} type="button" aria-label="Закрыть">×</button>
        </div>

        <form className="student-form" onSubmit={handleSubmit}>
          <label>
            Имя
            <input
              autoFocus
              maxLength="80"
              onChange={(event) => setName(event.target.value)}
              placeholder="Например, Анна"
              required
              value={name}
            />
          </label>

          <fieldset>
            <legend>Аватар</legend>
            <div className="avatar-picker">
              {Object.entries(avatars).map(([id, item]) => (
                <label className={avatar === id ? 'avatar-option avatar-option--selected' : 'avatar-option'} key={id}>
                  <input
                    checked={avatar === id}
                    name="avatar"
                    onChange={() => setAvatar(id)}
                    type="radio"
                    value={id}
                  />
                  <span aria-hidden="true"><AnimalAvatar id={id} /></span>
                  <small>{item.label}</small>
                </label>
              ))}
            </div>
          </fieldset>

          <StatusMessage>{error}</StatusMessage>
          <div className="dialog-actions">
            <button className="secondary-button" disabled={saving} onClick={onClose} type="button">Отмена</button>
            <button className="primary-button" disabled={saving || !name.trim()} type="submit">
              {saving ? 'Сохраняем…' : student ? 'Сохранить' : 'Добавить ученика'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
