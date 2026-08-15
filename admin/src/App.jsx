import { useEffect, useState } from 'react'
import { logoutAdmin, observeAuth, verifyAdmin } from './firebase/auth.js'
import AdminPage from './components/AdminPage.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import LoginPage from './components/LoginPage.jsx'

export default function App() {
  const [status, setStatus] = useState('loading')
  const [accessError, setAccessError] = useState('')

  useEffect(() => {
    let mounted = true

    async function handleAuthState(user) {
      let nextStatus = 'guest'

      try {
        if (!user) {
          return
        }

        const allowed = await verifyAdmin(user)
        if (allowed) {
          setAccessError('')
          nextStatus = 'admin'
        } else {
          setAccessError('Доступ запрещён')
          logoutAdmin().catch(() => {})
        }
      } catch (error) {
        console.error('Не удалось проверить доступ администратора:', error)
        setAccessError('Не удалось проверить доступ администратора. Попробуйте ещё раз.')
        logoutAdmin().catch(() => {})
      } finally {
        if (mounted) setStatus(nextStatus)
      }
    }

    const unsubscribe = observeAuth(handleAuthState, (error) => {
      console.error('Не удалось восстановить сессию:', error)
      if (mounted) {
        setAccessError('Не удалось восстановить сессию. Войдите ещё раз.')
        setStatus('guest')
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  if (status === 'loading') return <LoadingScreen />
  if (status === 'admin') return <AdminPage />
  return <LoginPage accessError={accessError} />
}
