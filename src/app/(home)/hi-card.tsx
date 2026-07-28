'use client'

import { useState, useRef, useEffect } from 'react'
import { useCenterStore } from '@/hooks/use-center'
import Card from '@/components/card'
import { useConfigStore } from './stores/config-store'
import { HomeDraggableLayer } from './home-draggable-layer'
import Link from 'next/link'

// ===== 音乐配置 =====
const MUSIC_FILES = ['/music/close-to-you.mp3']

function getGreeting() {
	const hour = new Date().getHours()

	if (hour >= 6 && hour < 12) {
		return 'Good Morning'
	} else if (hour >= 12 && hour < 18) {
		return 'Good Afternoon'
	} else if (hour >= 18 && hour < 22) {
		return 'Good Evening'
	} else {
		return 'Good Night'
	}
}

export default function HiCard() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const greeting = getGreeting()
	const styles = cardStyles.hiCard
	const username = siteContent.meta.username || 'Suni'

	// ===== 音乐播放逻辑 =====
	const [isPlaying, setIsPlaying] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const currentIndexRef = useRef(0)

	// 初始化音频
	useEffect(() => {
		if (!audioRef.current) {
			audioRef.current = new Audio()
		}

		const audio = audioRef.current

		const handleEnded = () => {
			const nextIndex = (currentIndexRef.current + 1) % MUSIC_FILES.length
			currentIndexRef.current = nextIndex
			setCurrentIndex(nextIndex)
		}

		audio.addEventListener('ended', handleEnded)

		return () => {
			audio.removeEventListener('ended', handleEnded)
		}
	}, [])

	// 切换歌曲
	useEffect(() => {
		currentIndexRef.current = currentIndex
		if (audioRef.current) {
			const wasPlaying = !audioRef.current.paused
			audioRef.current.pause()
			audioRef.current.src = MUSIC_FILES[currentIndex]
			audioRef.current.loop = false

			if (wasPlaying) {
				audioRef.current.play().catch(console.error)
			}
		}
	}, [currentIndex])

	// 播放/暂停
	useEffect(() => {
		if (!audioRef.current) return

		if (isPlaying) {
			audioRef.current.play().catch(console.error)
		} else {
			audioRef.current.pause()
		}
	}, [isPlaying])

	// 清理
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause()
				audioRef.current.src = ''
			}
		}
	}, [])

	const togglePlayPause = () => {
		setIsPlaying(!isPlaying)
	}

	// ===== 位置计算 =====
	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x - styles.width / 2
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y - styles.height / 2

	return (
		<HomeDraggableLayer cardKey='hiCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className='relative text-center max-sm:static max-sm:translate-0'>
				{siteContent.enableChristmas && (
					<>
						<img
							src='/images/christmas/snow-1.webp'
							alt='Christmas decoration'
							className='pointer-events-none absolute'
							style={{ width: 180, left: -20, top: -25, opacity: 0.9 }}
						/>
						<img
							src='/images/christmas/snow-2.webp'
							alt='Christmas decoration'
							className='pointer-events-none absolute'
							style={{ width: 160, bottom: -12, right: -8, opacity: 0.9 }}
						/>
					</>
				)}
				<Link href='/live2d'>
					<img src='/images/avatar.png' className='mx-auto rounded-full' style={{ width: 120, height: 120, boxShadow: ' 0 16px 32px -5px #E2D9CE' }} />
				</Link>
				<h1 className='font-averia mt-3 text-2xl'>
					{greeting} <br /> I'm <span className='text-linear text-[32px]'>{username}</span> , Nice to <br /> meet you!
				</h1>

				{/* ===== 🎵 音乐按钮（右下角） ===== */}
				<button
					onClick={togglePlayPause}
					className='absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-110 hover:bg-white/25'
					title={isPlaying ? '暂停音乐' : '播放音乐'}
				>
					{isPlaying ? '⏸️' : '🎵'}
				</button>
			</Card>
		</HomeDraggableLayer>
	)
}
