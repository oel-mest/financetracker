import crypto from 'crypto'

/**
 * Generates a deterministic hash for duplicate detection.
 * Same user + date + amount + description = same hash.
 */
export function buildTransactionHash(
  userId: string,
  date: string,
  amount: number,
  description: string,
  index?: number
): string {
  const raw = `${userId}|${date}|${amount}|${description.trim().toLowerCase()}${index !== undefined ? `|${index}` : ''}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}
