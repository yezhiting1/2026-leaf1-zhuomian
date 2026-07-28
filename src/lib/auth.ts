import { GITHUB_CONFIG } from '@/consts'

const GITHUB_TOKEN_CACHE_KEY = 'github_token'

function getTokenFromCache(): string | null {
    if (typeof sessionStorage === 'undefined') return null
    try {
        return sessionStorage.getItem(GITHUB_TOKEN_CACHE_KEY)
    } catch {
        return null
    }
}

function saveTokenToCache(token: string): void {
    if (typeof sessionStorage === 'undefined') return
    try {
        sessionStorage.setItem(GITHUB_TOKEN_CACHE_KEY, token)
    } catch (error) {
        console.error('Failed to save token to cache:', error)
    }
}

export function clearAllAuthCache(): void {
    if (typeof sessionStorage === 'undefined') return
    try {
        sessionStorage.removeItem(GITHUB_TOKEN_CACHE_KEY)
    } catch (error) {
        console.error('Failed to clear auth cache:', error)
    }
}

export async function hasAuth(): Promise<boolean> {
    return !!getTokenFromCache()
}

export async function getAuthToken(): Promise<string> {
    // 1. 先尝试从缓存获取
    const cachedToken = getTokenFromCache()
    if (cachedToken) {
        return cachedToken
    }

    // 2. 🔥 通过内部 API 获取（利用 Next.js 服务端能力）
    // 在客户端请求时，Next.js 会自动处理，不会暴露 Token
    const response = await fetch('/api/github-token')
    if (!response.ok) {
        throw new Error('GITHUB_TOKEN not set')
    }
    const data = await response.json()
    const token = data.token

    // 缓存 token
    saveTokenToCache(token)
    return token
}
