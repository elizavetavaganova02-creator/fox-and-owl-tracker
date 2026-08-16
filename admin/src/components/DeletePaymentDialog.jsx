export default function DeletePaymentDialog({ saving, onCancel, onConfirm }) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog dialog--small delete-payment-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-payment-title">
        <div className="confirm-icon"><img alt="" src="/payments/payments_icon_receipt.png" /></div>
        <h2 id="delete-payment-title">Удалить эту оплату?</h2>
        <p>Сумма будет исключена из дохода за месяц.</p>
        <div className="dialog-actions">
          <button className="secondary-button" disabled={saving} onClick={onCancel} type="button">Отмена</button>
          <button className="danger-button" disabled={saving} onClick={onConfirm} type="button">{saving ? 'Удаляем...' : 'Удалить'}</button>
        </div>
      </section>
    </div>
  )
}
