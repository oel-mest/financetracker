import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
    return
  }

  if (err instanceof Error) {
    console.error('[ERROR]', err.message)
    res.status(500).json({ error: err.message })
    return
  }

  res.status(500).json({ error: 'Internal server error' })
}
