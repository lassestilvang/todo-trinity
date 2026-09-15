import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AchievementBadgeProps {
  id: string
  name: string
  description?: string
  icon: string
  category: string
  points: number
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  isUnlocked: boolean
  progress?: number
  onClick?: () => void
  size?: 'small' | 'medium' | 'large'
}

const rarityColors = {
  COMMON: 'bg-gray-100 text-gray-800 border-gray-300',
  UNCOMMON: 'bg-blue-100 text-blue-800 border-blue-300',
  RARE: 'bg-purple-100 text-purple-800 border-purple-300',
  EPIC: 'bg-red-100 text-red-800 border-red-300',
  LEGENDARY: 'bg-yellow-100 text-yellow-800 border-yellow-300',
}

const rarityBorders = {
  COMMON: 'border-gray-200',
  UNCOMMON: 'border-blue-400',
  RARE: 'border-purple-400',
  EPIC: 'border-red-400',
  LEGENDARY: 'border-yellow-400',
  LEGENDARY_GLOW: 'border-yellow-400 shadow-yellow-200',
}

export default function AchievementBadge({
  id,
  name,
  description,
  icon,
  category,
  points,
  rarity,
  isUnlocked,
  progress = 100,
  onClick,
  size = 'medium',
}: AchievementBadgeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    small: 'w-12 h-12 text-lg',
    medium: 'w-16 h-16 text-xl',
    large: 'w-20 h-20 text-2xl',
  }

  const glowEffect = isUnlocked && rarity === 'LEGENDARY' && isHovered

  return (
    <motion.div
      whileHover={{ scale: glowEffect ? 1.1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative cursor-pointer rounded-full flex flex-col items-center justify-center
        ${rarityColors[rarity]} ${rarityBorders[rarity]}
        ${isUnlocked ? 'ring-2 ring-offset-2' : 'opacity-50 grayscale'}
        transition-all duration-200 ${sizeClasses[size]}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-2xl">{icon}</span>

      {/* Progress ring for unlocked but not complete achievements */}
      {isUnlocked && progress < 100 && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
        </div>
      )}

      {/* Rarity indicator */}
      {rarity === 'LEGENDARY' && isUnlocked && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center"
        >
          <span className="text-xs">⭐</span>
        </motion.div>
      )}

      {/* Glow for legendary unlocked badges */}
      {glowEffect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="absolute inset-0 rounded-full border-2 border-yellow-400 shadow-lg"
        />
      )}
    </motion.div>
  )
}