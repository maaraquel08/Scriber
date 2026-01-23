const STORAGE_KEY = "scriber-api-config"

export interface ApiConfig {
  assemblyAiKey: string
  geminiKey: string
}

const defaultConfig: ApiConfig = {
  assemblyAiKey: "",
  geminiKey: "",
}

/**
 * Retrieve stored API keys from localStorage
 */
export function getApiConfig(): ApiConfig {
  if (typeof window === "undefined") {
    return defaultConfig
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultConfig

    const parsed = JSON.parse(stored)
    return {
      assemblyAiKey: parsed.assemblyAiKey || "",
      geminiKey: parsed.geminiKey || "",
    }
  } catch {
    return defaultConfig
  }
}

/**
 * Save API keys to localStorage
 */
export function setApiConfig(config: Partial<ApiConfig>): void {
  if (typeof window === "undefined") return

  const current = getApiConfig()
  const updated = {
    ...current,
    ...config,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

/**
 * Clear all stored API keys
 */
export function clearApiConfig(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Check if both API keys are configured
 */
export function isApiConfigured(): boolean {
  const config = getApiConfig()
  return Boolean(config.assemblyAiKey && config.geminiKey)
}

/**
 * Check if AssemblyAI key is configured
 */
export function isAssemblyAiConfigured(): boolean {
  const config = getApiConfig()
  return Boolean(config.assemblyAiKey)
}

/**
 * Check if Gemini key is configured
 */
export function isGeminiConfigured(): boolean {
  const config = getApiConfig()
  return Boolean(config.geminiKey)
}
