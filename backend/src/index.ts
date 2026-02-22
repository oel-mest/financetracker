import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

import { authMiddleware } from './middleware/auth'
import { errorHandler }   from './middleware/errorHandler'
import authRoutes         from './routes/auth'
import accountRoutes      from './routes/accounts'
import categoryRoutes     from './routes/categories'
import transactionRoutes  from './routes/transactions'
import budgetRoutes       from './routes/budgets'
import rulesRoutes        from './routes/rules'
import dashboardRoutes    from './routes/dashboard'
import importRoutes       from './routes/imports'
import insightRoutes      from './routes/insights'

const app = express()
const PORT = process.env.BACKEND_PORT || 2027

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '10mb' }))

// Public
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend', port: PORT })
})
app.use('/auth', authRoutes)

// Protected
app.use('/accounts',     authMiddleware, accountRoutes)
app.use('/categories',   authMiddleware, categoryRoutes)
app.use('/transactions', authMiddleware, transactionRoutes)
app.use('/budgets',      authMiddleware, budgetRoutes)
app.use('/rules',        authMiddleware, rulesRoutes)
app.use('/dashboard',    authMiddleware, dashboardRoutes)
app.use('/imports',      authMiddleware, importRoutes)
app.use('/insights',     authMiddleware, insightRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`)
})