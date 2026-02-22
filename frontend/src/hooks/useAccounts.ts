import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export interface Account {
  id:         string
  name:       string
  type:       'cash' | 'card' | 'cih'
  currency:   string
  balance:    number
  color:      string | null
  created_at: string
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/accounts')
      setAccounts(data)
    } catch {
      setError('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (payload: Partial<Account>) => {
    const { data } = await api.post('/accounts', payload)
    setAccounts((prev) => [...prev, data])
    return data
  }

  const update = async (id: string, payload: Partial<Account>) => {
    const { data } = await api.patch(`/accounts/${id}`, payload)
    setAccounts((prev) => prev.map((a) => (a.id === id ? data : a)))
    return data
  }

  const remove = async (id: string) => {
    await api.delete(`/accounts/${id}`)
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  return { accounts, loading, error, refetch: fetch, create, update, remove }
}