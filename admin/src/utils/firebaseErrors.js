const friendlyMessages = {
  'auth/invalid-credential': 'Неверный email или пароль.',
  'auth/invalid-email': 'Проверьте правильность email.',
  'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже.',
  'auth/network-request-failed': 'Нет связи с сервером. Проверьте интернет.',
}

export function getFirebaseErrorMessage(error, fallback) {
  return friendlyMessages[error?.code] || error?.message || fallback
}
