import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'

const router = Router()

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  const body = SignupSchema.parse(req.body)

  const { data, error } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  })

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.status(201).json({ message: 'Account created', userId: data.user.id })
})

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const body = LoginSchema.parse(req.body)

  const { createClient } = await import('@supabase/supabase-js')
  const anonClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )

  const { data, error } = await anonClient.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  })

  if (error || !data.session) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  })
})

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = z.object({ refresh_token: z.string() }).parse(req.body)

  const { createClient } = await import('@supabase/supabase-js')
  const anonClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )

  const { data, error } = await anonClient.auth.refreshSession({ refresh_token })

  if (error || !data.session) {
    res.status(401).json({ error: 'Invalid refresh token' })
    return
  }

  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
})

export default router
