export const PARENT_CODE_LENGTH = 6

export function normalizeParentCode(value: unknown) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, PARENT_CODE_LENGTH)
}

export function isSixDigitParentCode(value: unknown) {
  return /^\d{6}$/.test(normalizeParentCode(value))
}

export function createSixDigitParentCode() {
  return String(Math.floor(Math.random() * 1000000)).padStart(PARENT_CODE_LENGTH, '0')
}
