export function encodeToBase64(str: string) {
  const strBytes = new TextEncoder().encode(str)
  const binString = Array.from(strBytes, (byte) => {
    return String.fromCodePoint(byte)
  }).join('')

  return btoa(binString)
}

export function decodeFromBase64(b64: string) {
  const binString = atob(b64)
  const strBytes = Uint8Array.from(binString as unknown as Iterable<number>, (m) => (m as unknown as string).codePointAt(0) ?? 0)
  return new TextDecoder().decode(strBytes)
}
