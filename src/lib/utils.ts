import { clsx, type ClassValue } from 'clsx'
export function cn(...values: ClassValue[]) { return clsx(values) }
export function envReady(keys: string[]) { return keys.every((key) => Boolean(process.env[key])) }
