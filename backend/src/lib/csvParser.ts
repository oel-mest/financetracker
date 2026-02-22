import { parse } from 'csv-parse/sync'

export interface RawCsvRow {
  date:        string
  description: string
  amount:      string
  type:        string
  merchant?:   string
  notes?:      string
  tags?:       string
  category?:   string
}

export interface ParsedCsvTransaction {
  date:        string
  description: string
  amount:      number
  type:        'debit' | 'credit'
  merchant:    string | null
  notes:       string | null
  tags:        string[]
}

/**
 * Parses a CSV buffer into normalized transaction rows.
 * Expected columns: date, description, amount, type
 * Optional columns: merchant, notes, tags
 */
export function parseCsv(buffer: Buffer): ParsedCsvTransaction[] {
  const rows: RawCsvRow[] = parse(buffer, {
    columns:          true,
    skip_empty_lines: true,
    trim:             true,
  })

  const results: ParsedCsvTransaction[] = []

  for (const row of rows) {
    const amount = parseFloat(row.amount?.replace(',', '.') ?? '0')
    if (isNaN(amount) || amount <= 0) continue

    const type = normalizeType(row.type)
    if (!type) continue

    const date = normalizeDate(row.date)
    if (!date) continue

    results.push({
      date,
      description: row.description?.trim() ?? '',
      amount,
      type,
      merchant: row.merchant?.trim() || null,
      notes:    row.notes?.trim()    || null,
      tags:     row.tags
        ? row.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    })
  }

  return results
}

function normalizeType(raw: string): 'debit' | 'credit' | null {
  const v = raw?.toLowerCase().trim()
  if (['debit', 'debit', 'expense', 'sortie', 'out', '-'].includes(v)) return 'debit'
  if (['credit', 'income', 'entree', 'in', '+'].includes(v))           return 'credit'
  return null
}

function normalizeDate(raw: string): string | null {
  if (!raw) return null
  // Support DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const parts = raw.includes('/')
    ? raw.split('/')
    : raw.includes('-')
    ? raw.split('-')
    : null

  if (!parts || parts.length !== 3) return null

  let [a, b, c] = parts
  // If first part is 4 digits it's already YYYY-MM-DD
  if (a.length === 4) return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`
  // Otherwise assume DD/MM/YYYY
  return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`
}