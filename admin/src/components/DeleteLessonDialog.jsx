import { UiIcon } from './UiIcon.jsx'

export default function DeleteLessonDialog({ lesson, saving, onCancel, onConfirm }) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog dialog--small" role="alertdialog" aria-modal="true" aria-labelledby="delete-lesson-title">
        <div className="confirm-icon"><UiIcon name="lessons" size={27} /></div>
        <h2 id="delete-lesson-title">Удалить этот урок?</h2>
        <p>Монеты и количество завершённых уроков ученика будут пересчитаны. Это действие нельзя отменить.</p>
        <div className="dialog-actions">
          <button className="secondary-button" disabled={saving} onClick={onCancel} type="button">Отмена</button>
          <button className="danger-button" disabled={saving} onClick={() => onConfirm(lesson)} type="button">
            {saving ? 'Удаляем…' : 'Удалить'}
          </button>
        </div>
      </section>
    </div>
  )
}
