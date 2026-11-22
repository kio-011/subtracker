import { ApiError, NetworkError } from '../api/client'
import type { Dict } from '../i18n/ru'

// The server sends a machine code and parameters; every text lives in the
// dictionaries. A code we do not know still has to produce a usable screen.
const BY_CODE: Record<string, keyof Dict['import']['errors']> = {
  'statement.too_large': 'tooLarge',
  'statement.unsupported_media_type': 'wrongFormat',
  'statement.empty': 'emptyFile',
  'statement.missing_columns': 'badColumns',
  'statement.delimiter_unknown': 'badColumns',
  'statement.undecodable': 'unparsable',
  'statement.unparsable': 'unparsable',
  'statement.no_outflows_detected': 'unparsable',
  'statement.too_many_rows': 'tooManyRows',
  'statement.analysis_timeout': 'timeout',
  'import.too_many_active': 'tooManyActive',
  'import.rate_limited': 'rateLimited',
  'import.expired': 'expired',
  'import.not_found': 'notFound',
  'candidate.not_found': 'notFound',
  'import.already_confirmed': 'alreadyConfirmed',
  'confirm.amount_conflict': 'amountConflict',
}

export function errorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null
  const detail = error.detail as { code?: unknown } | null
  return typeof detail?.code === 'string' ? detail.code : null
}

export function importMessage(error: unknown, t: Dict): string {
  if (error instanceof NetworkError) return t.common.errorNetwork
  const code = errorCode(error)
  const key = code ? BY_CODE[code] : undefined
  return key ? t.import.errors[key] : t.import.errors.unknown
}

// Codes that arrive inside a successful confirmation, for elements that were
// not applied (contract, decision Р13). They are not request failures.
export function skipReason(code: string, t: Dict): string {
  if (code === 'confirm.amount_conflict') return t.import.notAppliedConflict
  return t.import.notAppliedInvalid
}
