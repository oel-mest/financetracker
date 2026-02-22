import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export interface Category {
  id:         string
  name:       string
  icon:       string | null
  color:      string | null
  is_default: boolean
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(data))
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading }
}