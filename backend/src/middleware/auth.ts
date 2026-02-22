import { Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import { AuthRequest } from '../types'

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const token = authHeader.split(' ')[1]

  // Use a per-request client with the user's JWT to verify identity
  const userClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  )

  const { data, error } = await userClient.auth.getUser()

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  req.user = {
    id: data.user.id,
    email: data.user.email ?? '',
  }

  next()
}
