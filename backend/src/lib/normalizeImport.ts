import { buildTransactionHash } from './hash'
import { autoCategorize }       from './autoCategorize'
import { supabase }             from './supabase'

export interface RawImportTransaction {
  date:        string
  description: string
  amount:      number
  type:        'debit' | 'credit'
  merchant?:   string | null
  notes?:      string | null
  tags?:       string[]
}

export interface NormalizedTransaction extends RawImportTransaction {
  hash:        string
  category_id: string | null
  is_duplicate: boolean
  duplicate_id: string | null
}

/**
 * Takes raw parsed transactions, runs auto-categorization,
 * builds hashes, and checks for duplicates.
 */
export async function normalizeImport(
  userId:       string,
  accountId:    string,
  rawRows:      RawImportTransaction[]
): Promise<NormalizedTransaction[]> {
  const results: NormalizedTransaction[] = []

  for (const [index, row] of rawRows.entries()) {
    const hash = buildTransactionHash(userId, row.date, row.amount, row.description, index)

    // Check duplicate
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('hash', hash)
      .single()

    // Auto-categorize
    const category_id = await autoCategorize(
      userId,
      `${row.description} ${row.merchant ?? ''}`
    )

    results.push({
      ...row,
      merchant:     row.merchant    ?? null,
      notes:        row.notes       ?? null,
      tags:         row.tags        ?? [],
      hash,
      category_id,
      is_duplicate: !!existing,
      duplicate_id: existing?.id ?? null,
    })
  }

  return results
}