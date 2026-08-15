export default function StatusMessage({ children, type = 'error' }) {
  if (!children) return null

  return (
    <div className={`status-message status-message--${type}`} role="alert">
      {children}
    </div>
  )
}
