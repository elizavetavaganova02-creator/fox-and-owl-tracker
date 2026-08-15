import { useState } from 'react'
import { loginAdmin } from '../firebase/auth.js'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors.js'
import StatusMessage from './StatusMessage.jsx'
import { BrandMark } from './UiIcon.jsx'

export default function LoginPage({ accessError = '' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await loginAdmin(email.trim(), password)
    } catch (loginError) {
      setError(getFirebaseErrorMessage(loginError, 'Не удалось войти.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="brand-mark"><BrandMark /></div>
        <p className="eyebrow">Лиса и Сова · Fox & Owl</p>
        <h1>Панель учителя</h1>
        <p>Ученики, уроки и прогресс — в одном понятном месте.</p>
      </section>

      <section className="login-card">
        <p className="eyebrow">Добро пожаловать</p>
        <h2>Вход</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Пароль
            <input
              autoComplete="current-password"
              minLength="6"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <StatusMessage>{error || accessError}</StatusMessage>
          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? 'Входим…' : 'Войти'}
          </button>
        </form>
      </section>
    </main>
  )
}
