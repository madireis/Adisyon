import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}s ${m}dk` : `${h}s`
}

export function getElapsedMinutes(startTime: Date): number {
  return Math.floor((Date.now() - new Date(startTime).getTime()) / 60000)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function getTimeString(date?: Date): string {
  const d = date || new Date()
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export function getDateString(date?: Date): string {
  const d = date || new Date()
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}
