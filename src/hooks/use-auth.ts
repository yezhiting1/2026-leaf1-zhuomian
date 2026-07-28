import { create } from 'zustand'
import { clearAllAuthCache, getAuthToken as getToken, hasAuth as checkAuth } from '@/lib/auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'

interface AuthStore {
	// State
	isAuth: boolean
	privateKey: string | null

	// Actions
	setPrivateKey: (key: string) => void
	clearAuth: () => void
	refreshAuthState: () => void
	getAuthToken: () => Promise<string>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
	isAuth: false,
	privateKey: null,

	setPrivateKey: async (key: string) => {
		set({ isAuth: true, privateKey: key })
		// 🔥 删除 savePemToCache 调用
		// const { siteContent } = useConfigStore.getState()
		// if (siteContent?.isCachePem) {
		// 	await savePemToCache(key)
		// }
	},

	clearAuth: () => {
		clearAllAuthCache()
		set({ isAuth: false })
	},

	refreshAuthState: async () => {
		set({ isAuth: await checkAuth() })
	},

	getAuthToken: async () => {
		const token = await getToken()
		get().refreshAuthState()
		return token
	}
}))

// 🔥 删除这两段，因为 getPemFromCache 已经不存在了
// getPemFromCache().then((key) => {
// 	if (key) {
// 		useAuthStore.setState({ privateKey: key })
// 	}
// })

// checkAuth 保留
checkAuth().then((isAuth) => {
	if (isAuth) {
		useAuthStore.setState({ isAuth })
	}
})
