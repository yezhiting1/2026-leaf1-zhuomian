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

// ========== 在这里设置你的固定密码 ==========
const SAVE_PASSWORD = "Zhiting";
// ==================================================

export default function ConfigDialog({ open, onClose }: ConfigDialogProps) {
	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent, setSiteContent, cardStyles, setCardStyles, regenerateBubbles } = useConfigStore()
	const [formData, setFormData] = useState<SiteContent>(siteContent)
	const [cardStylesData, setCardStylesData] = useState<CardStyles>(cardStyles)
	const [originalData, setOriginalData] = useState<SiteContent>(siteContent)
	const [originalCardStyles, setOriginalCardStyles] = useState<CardStyles>(cardStyles)
	const [isSaving, setIsSaving] = useState(false)
	const [activeTab, setActiveTab] = useState<TabType>('site')
	// 新增密码输入状态
	const [inputPassword, setInputPassword] = useState("")
	const [showPasswordInput, setShowPasswordInput] = useState(false)
	// 临时授权标记（本次弹窗有效，不写入全局密钥）
	const [tempAuth, setTempAuth] = useState(false)

	const [faviconItem, setFaviconItem] = useState<FileItem | null>(null)
	const [avatarItem, setAvatarItem] = useState<FileItem | null>(null)
	const [artImageUploads, setArtImageUploads] = useState<ArtImageUploads>({})
	const [backgroundImageUploads, setBackgroundImageUploads] = useState<BackgroundImageUploads>({})
	const [socialButtonImageUploads, setSocialButtonImageUploads] = useState<SocialButtonImageUploads>({})

	useEffect(() => {
		if (open) {
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
			// 弹窗打开重置密码输入框与临时授权
			setInputPassword("")
			setShowPasswordInput(false)
			setTempAuth(false)
		}
	}, [open, siteContent, cardStyles])

	useEffect(() => {
		return () => {
			if (faviconItem?.type === 'file') URL.revokeObjectURL(faviconItem.previewUrl)
			if (avatarItem?.type === 'file') URL.revokeObjectURL(avatarItem.previewUrl)
			Object.values(artImageUploads).forEach(item => { if (item.type === 'file') URL.revokeObjectURL(item.previewUrl) })
			Object.values(backgroundImageUploads).forEach(item => { if (item.type === 'file') URL.revokeObjectURL(item.previewUrl) })
			Object.values(socialButtonImageUploads).forEach(item => { if (item.type === 'file') URL.revokeObjectURL(item.previewUrl) })
		}
	}, [faviconItem, avatarItem, artImageUploads, backgroundImageUploads, socialButtonImageUploads])

	// 密码校验函数，移除错误setPrivateKey
	const checkPasswordAndSave = () => {
		if (inputPassword.trim() !== SAVE_PASSWORD) {
			toast.error("密码错误，请重新输入")
			return
		}
		// 临时授权，直接执行保存
		setTempAuth(true)
		setShowPasswordInput(false)
		handleSave()
	}

	const handleSaveClick = () => {
		// 全局已授权 或 本次弹窗密码验证通过，直接保存
		if (isAuth || tempAuth) {
			handleSave()
		} else {
			// 未授权展示密码输入框
			setShowPasswordInput(true)
		}
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			const originalArtImages = originalData.artImages ?? []
			const currentArtImages = formData.artImages ?? []
			const removedArtImages = originalArtImages.filter(orig => !currentArtImages.some(current => current.id === orig.id))

			const originalBackgroundImages = originalData.backgroundImages ?? []
			const currentBackgroundImages = formData.backgroundImages ?? []
			const removedBackgroundImages = originalBackgroundImages.filter(orig => !currentBackgroundImages.some(current => current.id === orig.id))

			await pushSiteContent(
				formData,
				cardStylesData,
				faviconItem,
				avatarItem,
				artImageUploads,
				removedArtImages,
				backgroundImageUploads,
				removedBackgroundImages,
				socialButtonImageUploads
			)
			setSiteContent(formData)
			setCardStyles(cardStylesData)
			updateThemeVariables(formData.theme)
			setFaviconItem(null)
			setAvatarItem(null)
			setArtImageUploads({})
			setBackgroundImageUploads({})
			setSocialButtonImageUploads({})
			onClose()
			toast.success("配置保存成功")
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		if (faviconItem?.type === 'file') URL.revokeObjectURL(faviconItem.previewUrl)
		if (avatarItem?.type === 'file') URL.revokeObjectURL(avatarItem.previewUrl)
		Object.values(artImageUploads).forEach(item => { if (item.type === 'file') URL.revokeObjectURL(item.previewUrl) })
		Object.values(backgroundImageUploads).forEach(item => { if (item.type === 'file') URL.revokeObjectURL(item.previewUrl) })
		Object.values(socialButtonImageUploads).forEach(item => { if (item.type === 'file') URL.revokeObjectURL(item.previewUrl) })

		setSiteContent(originalData)
		setCardStyles(originalCardStyles)
		regenerateBubbles()

		if (typeof document !== 'undefined') {
			document.title = originalData.meta.title
			const metaDescription = document.querySelector('meta[name="description"]')
			if (metaDescription) metaDescription.setAttribute('content', originalData.meta.description)
		}
		updateThemeVariables(originalData.theme)
		setFaviconItem(null)
		setAvatarItem(null)
		setArtImageUploads({})
		setBackgroundImageUploads({})
		setSocialButtonImageUploads({})
		setInputPassword("")
		setShowPasswordInput(false)
		setTempAuth(false)
		onClose()
	}

	const updateThemeVariables = (theme?: SiteContent['theme']) => {
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
	}

	const handlePreview = () => {
		setSiteContent(formData)
		setCardStyles(cardStylesData)
		regenerateBubbles()
		if (typeof document !== 'undefined') {
			document.title = formData.meta.title
			const metaDescription = document.querySelector('meta[name="description"]')
			if (metaDescription) metaDescription.setAttribute('content', formData.meta.description)
		}
		updateThemeVariables(formData.theme)
		onClose()
	}

	// 按钮文字区分全局授权状态
	const buttonText = isAuth ? '保存' : tempAuth ? '保存' : '导入密钥'

	const tabs: { id: TabType; label: string }[] = [
		{ id: 'site', label: '网站设置' },
		{ id: 'color', label: '色彩配置' },
		{ id: 'layout', label: '首页布局' }
	]

	return (
		<>
			{/* 原隐藏pem文件上传input已完全删除 */}

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
					<div className='flex gap-3 items-center'>
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

				{/* 修复：密码框包裹form，自动回车提交，移除多余onKeyDown */}
				{showPasswordInput && (
					<form 
						onSubmit={(e) => {
							e.preventDefault()
							checkPasswordAndSave()
						}}
						className='mb-4 p-4 border rounded-lg bg-card'
					>
						<p className='mb-2 text-sm text-secondary'>请输入保存密码</p>
						<div className='flex gap-2'>
							<input
								type='password'
								value={inputPassword}
								onChange={(e) => setInputPassword(e.target.value)}
								className='flex-1 px-3 py-2 rounded border bg-bg'
								placeholder='输入密码'
							/>
							<button type="submit" className='brand-btn px-4 py-2 text-sm'>
								确认保存
							</button>
						</div>
					</form>
				)}

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
		</>
	)
}
