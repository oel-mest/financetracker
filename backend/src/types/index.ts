import { Request } from 'express'

export interface AuthUser {
  id: string
  email: string
}

export interface AuthRequest extends Request {
  user?: AuthUser
}

export type AccountType = 'cash' | 'card' | 'cih'
export type TransactionType = 'debit' | 'credit'
export type ImportStatus = 'pending' | 'parsed' | 'confirmed' | 'failed'
export type ImportSource = 'csv' | 'pdf_cih'
