import axios from 'axios'

const PARSER_URL = process.env.PARSER_URL ?? 'http://parser:2028'

export interface ParsedPdfTransaction {
  date:        string
  description: string
  amount:      number
  type:        'debit' | 'credit'
  merchant:    string | null
}

export interface PdfParseResult {
  transactions:      ParsedPdfTransaction[]
  beginning_balance: number | null
  bank:              string | null
}

export async function parsePdf(storagePath: string, year: number): Promise<PdfParseResult> {
  const response = await axios.post(
    `${PARSER_URL}/parse`,
    { storage_path: storagePath, year },
    { timeout: 60000 }
  )
  return response.data as PdfParseResult
}