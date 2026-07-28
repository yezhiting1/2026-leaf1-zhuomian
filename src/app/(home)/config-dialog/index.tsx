'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { DialogModal } from '@/components/dialog-modal'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '../stores/config-store'
import { pushSiteContent } from '../services/push-site-content'
import type { SiteContent, CardStyles } from '../stores/config-store'
import { SiteSettings, type FileItem, type ArtImageUploads, type BackgroundImageUploads, type SocialButtonImageUploads } from './site-settings'
import { ColorConfig } from './color-config'
import { HomeLayout } from './home-layout'

interface ConfigDialogProps {
	open: boolean
	onClose: () => void
}

type TabType = 'site' | 'color' | 'layout'

export default function ConfigDialog({ open, onClose }: ConfigDialogProps) {
	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent, setSiteContent, cardStyles, setCardStyles, regenerateBubbles } = useConfigStore()
	const [formData, setFormData] = useState<SiteContent>(siteContent)
	const [cardStylesData, setCardStylesData] = useState<CardStyles>(cardStyles)
	const [originalData, setOriginalData] = useState<SiteContent>(siteContent)
	const [originalCardStyles, setOriginalCardStyles] = useState<CardStyles>(cardStyles)
	const [isSaving, setIsSaving] = useState(false)
	const [activeTab, setActiveTab] = useState<TabType>('site')
	const keyInputRef = useRef<HTMLInputElement>(null)
	const [faviconItem, setFaviconItem] = useState<FileItem | null>(null)
	const [avatarItem, setAvatarItem] = useState<FileItem | null>(null)
	const [artImageUploads, setArtImageUploads] = useState<ArtImageUploads>({})
	const [backgroundImageUploads, setBackgroundImageUploads] = useState<BackgroundImageUploads>({})
	const [socialButtonImageUploads, setSocialButtonImageUploads] = useState<SocialButtonImageUploads>({})
	
	const [showPasswordDialog, setShowPasswordDialog] = useState(false)
	const [password, setPassword] = useState('')
	const [passwordError, setPasswordError] = useState('')
	const passwordInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (open) {
			try {
				const current = { ...siteContent }
				const currentCardStyles = { ...cardStyles }
				setFormData(current)
				setCardStylesData(currentCardStyles)
				setOriginalData(current)
				setOriginalCardStyles(currentCardStyles)
				setFaviconItem(null)
				setAvatarItem(null)
				setArtImageUploads({})
				setBackgroundImageUploads({})
				setSocialButtonImageUploads({})
				setActiveTab('site')
				setShowPasswordDialog(false)
				setPassword('')
				setPasswordError('')
			} catch (error) {
				console.error('初始化数据失败:', error)
			}
		}
	}, [open, siteContent, cardStyles])

	useEffect(() => {
		return () => {
			try {
				if (faviconItem?.type === 'file' && faviconItem.previewUrl) {
					URL.revokeObjectURL(faviconItem.previewUrl)
				}
				if (avatarItem?.type === 'file' && avatarItem.previewUrl) {
					URL.revokeObjectURL(avatarItem.previewUrl)
				}
				if (artImageUploads && typeof artImageUploads === 'object') {
					Object.values(artImageUploads).forEach(item => {
						if (item?.type === 'file' && item?.previewUrl) {
							URL.revokeObjectURL(item.previewUrl)
						}
					})
				}
				if (backgroundImageUploads && typeof backgroundImageUploads === 'object') {
					Object.values(backgroundImageUploads).forEach(item => {
						if (item?.type === 'file' && item?.previewUrl) {
							URL.revokeObjectURL(item.previewUrl)
						}
					})
				}
				if (socialButtonImageUploads && typeof socialButtonImageUploads === 'object') {
					Object.values(socialButtonImageUploads).forEach(item => {
						if (item?.type === 'file' && item?.previewUrl) {
							URL.revokeObjectURL(item.previewUrl)
						}
					})
				}
			} catch (error) {
				console.error('清理资源失败:', error)
			}
		}
	}, [faviconItem, avatarItem, artImageUploads, backgroundImageUploads, socialButtonImageUploads])

	const handleChoosePrivateKey = async (file: File) => {
		if (!file) return
		try {
			const text = await file.text()
			if (text) {
				setPrivateKey(text)
				// 不自动保存，让用户手动点击保存
				toast.success('密钥导入成功')
			}
		} catch (error) {
			console.error('读取密钥文件失败:', error)
			toast.error('读取密钥文件失败')
		}
	}

	const handleSaveClick = () => {
		try {
			setShowPasswordDialog(true)
			setPassword('')
			setPasswordError('')
			setTimeout(() => {
				if (passwordInputRef.current) {
					passwordInputRef.current.focus()
				}
			}, 100)
		} catch (error) {
			console.error('打开密码对话框失败:', error)
		}
	}

	const handlePasswordConfirm = () => {
		try {
			if (password === 'yzt') {
				setShowPasswordDialog(false)
				setPassword('')
				setPasswordError('')
				handleSave()
			} else {
				setPasswordError('密码错误，请重试')
				setPassword('')
				if (passwordInputRef.current) {
					passwordInputRef.current.focus()
				}
			}
		} catch (error) {
			console.error('密码验证失败:', error)
			setPasswordError('验证失败，请重试')
		}
	}

	const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		try {
			if (e.key === 'Enter') {
				handlePasswordConfirm()
			}
			if (e.key === 'Escape') {
				setShowPasswordDialog(false)
				setPassword('')
				setPasswordError('')
			}
		} catch (error) {
			console.error('键盘事件处理失败:', error)
		}
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			// 安全地获取数据
			const safeFormData = formData || siteContent || { meta: { title: '', description: '' }, theme: {} }
			const safeCardStyles = cardStylesData || cardStyles || { bubble: {}, card: {} }
			const safeOriginalData = originalData || siteContent || { meta: { title: '', description: '' }, theme: {} }
			
			// 计算要删除的图片
			const originalArtImages = safeOriginalData.artImages ?? []
			const currentArtImages = safeFormData.artImages ?? []
			const removedArtImages = originalArtImages.filter(orig => 
				!currentArtImages.some(current => current.id === orig.id)
			)

			const originalBackgroundImages = safeOriginalData.backgroundImages ?? []
			const currentBackgroundImages = safeFormData.backgroundImages ?? []
			const removedBackgroundImages = originalBackgroundImages.filter(orig => 
				!currentBackgroundImages.some(current => current.id === orig.id)
			)

			// 如果认证通过，尝试推送
			if (isAuth) {
				try {
					await pushSiteContent(
						safeFormData,
						safeCardStyles,
						faviconItem || null,
						avatarItem || null,
						artImageUploads || {},
						removedArtImages || [],
						backgroundImageUploads || {},
						removedBackgroundImages || [],
						socialButtonImageUploads || {}
					)
				} catch (pushError) {
					console.error('推送失败，但继续本地保存:', pushError)
					// 推送失败不影响本地保存
					toast.warning('远程保存失败，但已保存到本地')
				}
			} else {
				console.log('本地保存模式')
			}
			
			// 更新本地状态
			try {
				setSiteContent(safeFormData)
				setCardStyles(safeCardStyles)
				updateThemeVariables(safeFormData.theme)
			} catch (stateError) {
				console.error('更新状态失败:', stateError)
			}
			
			// 清理资源
			try {
				if (faviconItem?.type === 'file') {
					URL.revokeObjectURL(faviconItem.previewUrl)
				}
				if (avatarItem?.type === 'file') {
					URL.revokeObjectURL(avatarItem.previewUrl)
				}
				setFaviconItem(null)
				setAvatarItem(null)
				setArtImageUploads({})
				setBackgroundImageUploads({})
				setSocialButtonImageUploads({})
			} catch (cleanError) {
				console.error('清理资源失败:', cleanError)
			}
			
			onClose()
			toast.success(isAuth ? '保存成功' : '本地保存成功')
		} catch (error: any) {
			console.error('保存失败:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		try {
			// 清理资源
			if (faviconItem?.type === 'file' && faviconItem.previewUrl) {
				URL.revokeObjectURL(faviconItem.previewUrl)
			}
			if (avatarItem?.type === 'file' && avatarItem.previewUrl) {
				URL.revokeObjectURL(avatarItem.previewUrl)
			}
			if (artImageUploads) {
				Object.values(artImageUploads).forEach(item => {
					if (item?.type === 'file' && item?.previewUrl) {
						URL.revokeObjectURL(item.previewUrl)
					}
				})
			}
			if (backgroundImageUploads) {
				Object.values(backgroundImageUploads).forEach(item => {
					if (item?.type === 'file' && item?.previewUrl) {
						URL.revokeObjectURL(item.previewUrl)
					}
				})
			}
			if (socialButtonImageUploads) {
				Object.values(socialButtonImageUploads).forEach(item => {
					if (item?.type === 'file' && item?.previewUrl) {
						URL.revokeObjectURL(item.previewUrl)
					}
				})
			}
			
			// 恢复状态
			if (originalData) {
				setSiteContent(originalData)
				setCardStyles(originalCardStyles)
				regenerateBubbles()
				if (typeof document !== 'undefined') {
					document.title = originalData.meta?.title || ''
					const metaDescription = document.querySelector('meta[name="description"]')
					if (metaDescription) {
						metaDescription.setAttribute('content', originalData.meta?.description || '')
					}
				}
				updateThemeVariables(originalData.theme)
			}
			
			setFaviconItem(null)
			setAvatarItem(null)
			setArtImageUploads({})
			setBackgroundImageUploads({})
			setSocialButtonImageUploads({})
			setShowPasswordDialog(false)
			setPassword('')
			setPasswordError('')
			onClose()
		} catch (error) {
			console.error('取消操作失败:', error)
			onClose()
		}
	}

	const updateThemeVariables = (theme?: SiteContent['theme']) => {
		try {
			if (typeof document === 'undefined' || !theme) return

			const { colorBrand, colorBrandSecondary, colorPrimary, colorSecondary, colorBg, colorBorder, colorCard, colorArticle } = theme
			const root = document.documentElement

			if (colorBrand) root.style.setProperty('--color-brand', colorBrand)
			if (colorBrandSecondary) root.style.setProperty('--color-brand-secondary', colorBrandSecondary)
			if (colorPrimary) root.style.setProperty('--color-primary', colorPrimary)
			if (colorSecondary) root.style.setProperty('--color-secondary', colorSecondary)
			if (colorBg) root.style.setProperty('--color-bg', colorBg)
			if (colorBorder) root.style.setProperty('--color-border', colorBorder)
			if (colorCard) root.style.setProperty('--color-card', colorCard)
			if (colorArticle) root.style.setProperty('--color-article', colorArticle)
		} catch (error) {
			console.error('更新主题变量失败:', error)
		}
	}

	const handlePreview = () => {
		try {
			const safeFormData = formData || siteContent
			setSiteContent(safeFormData)
			setCardStyles(cardStylesData)
			regenerateBubbles()

			if (typeof document !== 'undefined') {
				document.title = safeFormData.meta?.title || ''
				const metaDescription = document.querySelector('meta[name="description"]')
				if (metaDescription) {
					metaDescription.setAttribute('content', safeFormData.meta?.description || '')
				}
			}
			updateThemeVariables(safeFormData.theme)
			onClose()
		} catch (error) {
			console.error('预览失败:', error)
			toast.error('预览失败')
			onClose()
		}
	}

	const buttonText = isAuth ? '保存' : '本地保存'

	const tabs: { id: TabType; label: string }[] = [
		{ id: 'site', label: '网站设置' },
		{ id: 'color', label: '色彩配置' },
		{ id: 'layout', label: '首页布局' }
	]

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					try {
						const f = e.target.files?.[0]
						if (f) await handleChoosePrivateKey(f)
						if (e.currentTarget) e.currentTarget.value = ''
					} catch (error) {
						console.error('文件选择失败:', error)
					}
				}}
			/>

			<DialogModal open={open} onClose={handleCancel} className='card scrollbar-none max-h-[90vh] min-h-[600px] w-[640px] overflow-y-auto'>
				<div className='mb-6 flex items-center justify-between'>
					<div className='flex gap-1'>
						{tabs.map(tab => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`relative px-4 py-2 text-sm font-medium transition-colors ${
									activeTab === tab.id ? 'text-brand' : 'text-secondary hover:text-primary'
								}`}>
								{tab.label}
								{activeTab === tab.id && <div className='bg-brand absolute right-0 bottom-0 left-0 h-0.5' />}
							</button>
						))}
					</div>
					<div className='flex gap-3'>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handlePreview}
							className='bg-card rounded-xl border px-6 py-2 text-sm'>
							预览
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleCancel}
							disabled={isSaving}
							className='bg-card rounded-xl border px-6 py-2 text-sm'>
							取消
						</motion.button>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6'>
							{isSaving ? '保存中...' : buttonText}
						</motion.button>
					</div>
				</div>

				<div className='min-h-[200px]'>
					{activeTab === 'site' && (
						<SiteSettings
							formData={formData}
							setFormData={setFormData}
							faviconItem={faviconItem}
							setFaviconItem={setFaviconItem}
							avatarItem={avatarItem}
							setAvatarItem={setAvatarItem}
							artImageUploads={artImageUploads}
							setArtImageUploads={setArtImageUploads}
							backgroundImageUploads={backgroundImageUploads}
							setBackgroundImageUploads={setBackgroundImageUploads}
							socialButtonImageUploads={socialButtonImageUploads}
							setSocialButtonImageUploads={setSocialButtonImageUploads}
						/>
					)}
					{activeTab === 'color' && <ColorConfig formData={formData} setFormData={setFormData} />}
					{activeTab === 'layout' && <HomeLayout cardStylesData={cardStylesData} setCardStylesData={setCardStylesData} onClose={onClose} />}
				</div>
			</DialogModal>

			{/* 密码验证弹窗 */}
			{showPasswordDialog && (
				<div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm'>
					<div className='card w-[400px] p-6'>
						<h3 className='mb-4 text-lg font-semibold'>请输入保存密码</h3>
						<div className='mb-4'>
							<input
								ref={passwordInputRef}
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								onKeyDown={handlePasswordKeyDown}
								placeholder='请输入密码'
								className='w-full rounded-lg border border-border bg-card px-4 py-2 text-sm outline-none transition-colors focus:border-brand'
								autoFocus
							/>
							{passwordError && (
								<p className='mt-2 text-sm text-red-500'>{passwordError}</p>
							)}
						</div>
						<div className='flex justify-end gap-3'>
							<button
								onClick={() => {
									setShowPasswordDialog(false)
									setPassword('')
									setPasswordError('')
								}}
								className='rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary/10'
							>
								取消
							</button>
							<button
								onClick={handlePasswordConfirm}
								className='brand-btn px-6 py-2 text-sm'
							>
								确认保存
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
