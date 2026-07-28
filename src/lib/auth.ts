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
        console.log('🔍 使用缓存的 Token:', cachedToken.slice(0, 10) + '...')
        return cachedToken
    }

    // 2. 🔥 通过 API 获取 Token（安全，不暴露）
    try {
        console.log('🔍 正在通过 API 获取 Token...')
        const response = await fetch('/api/github-token')
        const data = await response.json()
        console.log('🔍 API 返回:', data)
        
        if (!response.ok) {
            throw new Error(data.error || 'GITHUB_TOKEN not set')
        }
        
        const token = data.token
        console.log('🔍 获取到 Token:', token.slice(0, 10) + '...')

        // 缓存 token
        saveTokenToCache(token)
        return token
    } catch (error) {
        console.error('❌ 获取 GitHub Token 失败:', error)
        throw new Error('请在腾讯云环境变量中设置 GITHUB_TOKEN')
    }
}
