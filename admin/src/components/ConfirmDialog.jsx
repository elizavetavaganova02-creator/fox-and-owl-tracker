import { UiIcon } from './UiIcon.jsx'

export default function ConfirmDialog({ student, saving, onCancel, onConfirm }) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog dialog--small" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="confirm-icon"><UiIcon name="students" size={27} /></div>
        <h2 id="confirm-title">Скрыть ученика?</h2>
        <p>
          {student.name} исчезнет из списка активных учеников. История и прогресс сохранятся,
          ученика можно будет активировать снова.
        </p>
        <div className="dialog-actions">
          <button className="secondary-button" disabled={saving} onClick={onCancel} type="button">Отмена</button>
          <button className="danger-button" disabled={saving} onClick={onConfirm} type="button">
            {saving ? 'Скрываем…' : 'Скрыть'}
          </button>
        </div>
      </section>
    </div>
  )
}
