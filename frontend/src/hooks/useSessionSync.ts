import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { authApi, BACKEND_URL } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export function useSessionSync() {
  const token = useAuthStore(state => state.accessToken)
  const userId = useAuthStore(state => state.user?.id)
  const authenticated = useAuthStore(state => state.isAuthenticated)

  useEffect(() => {
    if (!authenticated || !token || !userId) return
    let disposed = false
    let running = false
    let pending = false
    let lastFailureRefresh = 0
    const refresh = async () => {
      if (disposed) return
      if (running) { pending = true; return }
      running = true
      try {
        const response = await authApi.me()
        if (!disposed && useAuthStore.getState().accessToken === token && response.data.data?.id === userId) {
          useAuthStore.getState().updateUser(response.data.data)
        }
      } catch {
        // HTTP 401 is handled by the shared interceptor; transient failures retry.
      } finally {
        running = false
        if (pending && !disposed) { pending = false; void refresh() }
      }
    }
    const socket = io(BACKEND_URL || window.location.origin, { auth: { token }, reconnection: true })
    const usersChanged = () => window.dispatchEvent(new Event('users:changed'))
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    socket.on('connect', refresh)
    socket.on('session:changed', refresh)
    socket.on('users:changed', usersChanged)
    socket.on('connect_error', () => {
      if (Date.now() - lastFailureRefresh > 60000) { lastFailureRefresh = Date.now(); void refresh() }
    })
    socket.on('disconnect', refresh)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', refresh)
    window.addEventListener('online', refresh)
    const fallback = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 60000)
    void refresh()
    return () => {
      disposed = true
      socket.disconnect()
      window.clearInterval(fallback)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('online', refresh)
    }
  }, [authenticated, token, userId])
}
