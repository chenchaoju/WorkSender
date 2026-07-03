const STORAGE_KEY = 'workshub_data'

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${key}`)
    if (raw) {
      return JSON.parse(raw) as T
    }
  } catch (e) {
    console.error('Failed to load from storage:', e)
  }
  return defaultValue
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save to storage:', e)
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY}_${key}`)
  } catch (e) {
    console.error('Failed to remove from storage:', e)
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}
