export const INIT_DELAY = 0.3
export const ANIMATION_DELAY = 0.1
export const CARD_SPACING = 36
export const CARD_SPACING_SM = 24
export const BLOG_SLUG_KEY = process.env.BLOG_SLUG_KEY || ''

/**
 * GitHub 仓库配置
 */
export const GITHUB_CONFIG = {
	OWNER: 'yezhiting1',  // ✅ 改成你的 GitHub 用户名
	REPO: '2026-leaf1-zhuomian',  // ✅ 改成你的仓库名
	BRANCH: 'main',  // ✅ 分支是 main
	APP_ID: process.env.NEXT_PUBLIC_GITHUB_APP_ID || '-',
	ENCRYPT_KEY: process.env.NEXT_PUBLIC_GITHUB_ENCRYPT_KEY || 'wudishiduomejimo',
} as const
