export function encodeChoreQR(choreId: string): string {
  return `chorechart:chore:${choreId}`
}

export function decodeChoreQR(raw: string): string | null {
  const prefix = 'chorechart:chore:'
  if (raw.startsWith(prefix)) {
    return raw.slice(prefix.length)
  }
  return null
}
