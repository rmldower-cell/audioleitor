import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "00:00"
  const totalM = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)

  if (totalM >= 60) {
    const h = Math.floor(totalM / 60)
    const m = totalM % 60
    return `${h}h ${m.toString().padStart(2, '0')}m`
  }

  return `${totalM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
