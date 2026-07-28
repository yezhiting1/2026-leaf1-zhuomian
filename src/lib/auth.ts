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
	return !!getTokenFromCache() || !!process.env.GITHUB_TOKEN
}

/**
 * 统一的认证 Token 获取
 * 🔥 直接从环境变量读取 GitHub Token，不需要私钥！
 */
export async function getAuthToken(): Promise<string> {
	// 1. 先尝试从缓存获取 token
	const cachedToken = getTokenFromCache()
	if (cachedToken) {
		return cachedToken
	}

	// 2. 🔥 从环境变量读取 GitHub Token
	const token = process.env.GITHUB_TOKEN
	if (!token) {
		throw new Error('请在环境变量中设置 GITHUB_TOKEN')
	}

	// 缓存 token
	saveTokenToCache(token)
	return token
}
