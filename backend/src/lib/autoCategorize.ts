import { supabase } from './supabase'

/**
 * Looks up categorization rules (default + user's own)
 * and returns the best matching category_id for a given text.
 * Higher priority rules win. User rules take precedence over defaults.
 */
export async function autoCategorize(
  userId: string,
  text: string
): Promise<string | null> {
  const normalized = text.toLowerCase()

  const { data: rules, error } = await supabase
    .from('categorization_rules')
    .select('category_id, keyword, priority, user_id')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('priority', { ascending: false })

  if (error || !rules) return null

  // User rules first, then defaults — within same priority
  const sorted = rules.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    // user rule wins over default at same priority
    if (a.user_id && !b.user_id) return -1
    if (!a.user_id && b.user_id) return 1
    return 0
  })

  for (const rule of sorted) {
    if (normalized.includes(rule.keyword.toLowerCase())) {
      return rule.category_id
    }
  }

  return null
}
