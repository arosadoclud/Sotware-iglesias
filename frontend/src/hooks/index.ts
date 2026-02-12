import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

// Hook para manejar fetchs con loading, error y data
export function useFetch<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.get(url)
        if (isMounted) {
          setData(response.data.data)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Error al cargar datos')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, deps)

  return { data, loading, error, refetch: () => {} }
}

// Hook para detectar click fuera de un elemento
export function useClickOutside(callback: () => void) {
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref && !ref.contains(e.target as Node)) {
        callback()
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ref, callback])

  return setRef
}

// Hook para detectar tamaño de pantalla
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

// Hook para debounce
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para verificar permisos
export function usePermissions() {
  const { user } = useAuthStore()

  const hasPermission = (resource: string, action: string) => {
    if (!user) return false
    // Implementar lógica de permisos basada en roles
    return true
  }

  const isAdmin = () => {
    return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  }

  const isPastor = () => {
    return user?.role === 'PASTOR' || user?.role === 'SUPER_ADMIN'
  }

  return { hasPermission, isAdmin, isPastor }
}

// Hook para localStorage tipado
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue] as const
}
