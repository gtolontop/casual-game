import { Entity } from '../store/gameStore'

export interface EnemyType {
  id: string
  name: string
  hp: number
  speed: number
  damage: number
  radius: number
  color: string
  xpReward: number
  scoreReward: number
  pattern?: string
}

export const enemyTypes: Record<string, EnemyType> = {
  // Basic enemies
  drone: { id: 'drone', name: 'Drone', hp: 10, speed: 1, damage: 10, radius: 12, color: '#FF006E', xpReward: 10, scoreReward: 10 },
  speeder: { id: 'speeder', name: 'Speeder', hp: 5, speed: 3, damage: 5, radius: 8, color: '#FB5607', xpReward: 15, scoreReward: 15 },
  tank: { id: 'tank', name: 'Tank', hp: 30, speed: 0.5, damage: 20, radius: 20, color: '#8338EC', xpReward: 30, scoreReward: 25 },
  swarm: { id: 'swarm', name: 'Swarm', hp: 3, speed: 2, damage: 5, radius: 6, color: '#FFBE0B', xpReward: 5, scoreReward: 5 },
  
  // Advanced enemies (appear later)
  sniper: { id: 'sniper', name: 'Sniper', hp: 15, speed: 0.8, damage: 30, radius: 14, color: '#00F5FF', xpReward: 40, scoreReward: 35, pattern: 'sniper' },
  bomber: { id: 'bomber', name: 'Bomber', hp: 20, speed: 1.2, damage: 40, radius: 16, color: '#FF4365', xpReward: 50, scoreReward: 40, pattern: 'explode' },
  shielder: { id: 'shielder', name: 'Shielder', hp: 40, speed: 0.7, damage: 15, radius: 18, color: '#06FFB4', xpReward: 60, scoreReward: 50, pattern: 'shield' },
  dasher: { id: 'dasher', name: 'Dasher', hp: 12, speed: 4, damage: 25, radius: 10, color: '#FF006E', xpReward: 45, scoreReward: 35, pattern: 'dash' }
}

export const bossTypes: Record<string, EnemyType> = {
  voidLord: { 
    id: 'voidLord', 
    name: 'Void Lord', 
    hp: 500, 
    speed: 0.5, 
    damage: 50, 
    radius: 40, 
    color: '#8338EC', 
    xpReward: 500, 
    scoreReward: 1000, 
    pattern: 'spiral' 
  },
  plasmaQueen: { 
    id: 'plasmaQueen', 
    name: 'Plasma Queen', 
    hp: 800, 
    speed: 1, 
    damage: 40, 
    radius: 35, 
    color: '#FF006E', 
    xpReward: 800, 
    scoreReward: 1500, 
    pattern: 'laser' 
  },
  chronoTitan: { 
    id: 'chronoTitan', 
    name: 'Chrono Titan', 
    hp: 1200, 
    speed: 0.3, 
    damage: 60, 
    radius: 50, 
    color: '#3A86FF', 
    xpReward: 1200, 
    scoreReward: 2500, 
    pattern: 'timewarp' 
  },
  voidEmperor: { 
    id: 'voidEmperor', 
    name: 'Void Emperor', 
    hp: 2000, 
    speed: 0.8, 
    damage: 80, 
    radius: 45, 
    color: '#000000', 
    xpReward: 2000, 
    scoreReward: 5000, 
    pattern: 'final' 
  }
}

export const getEnemiesForWave = (wave: number): string[] => {
  if (wave <= 2) return ['drone']
  if (wave <= 4) return ['drone', 'speeder']
  if (wave <= 6) return ['drone', 'speeder', 'tank']
  if (wave <= 8) return ['drone', 'speeder', 'tank', 'swarm']
  if (wave <= 12) return ['speeder', 'tank', 'swarm', 'sniper']
  if (wave <= 16) return ['tank', 'swarm', 'sniper', 'bomber']
  if (wave <= 20) return ['sniper', 'bomber', 'shielder', 'dasher']
  return ['bomber', 'shielder', 'dasher', 'sniper', 'tank']
}

export const getBossForWave = (wave: number): EnemyType | null => {
  if (wave === 5) return bossTypes.voidLord
  if (wave === 10) return bossTypes.plasmaQueen
  if (wave === 15) return bossTypes.chronoTitan
  if (wave === 20) return bossTypes.voidEmperor
  if (wave > 20 && wave % 5 === 0) {
    // Random boss with scaling HP
    const bossList = Object.values(bossTypes)
    const boss = bossList[Math.floor(Math.random() * bossList.length)]
    return {
      ...boss,
      hp: boss.hp * (1 + (wave - 20) * 0.1),
      damage: boss.damage * (1 + (wave - 20) * 0.05)
    }
  }
  return null
}

export const createEnemy = (
  type: EnemyType, 
  x: number, 
  y: number, 
  wave: number
): Entity => {
  // Scale enemy stats with wave
  const waveMultiplier = 1 + (wave - 1) * 0.1
  
  return {
    id: `enemy-${Date.now()}-${Math.random()}`,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: type.radius,
    color: type.color,
    type: 'enemy',
    subtype: type.id,
    hp: Math.floor(type.hp * waveMultiplier),
    maxHp: Math.floor(type.hp * waveMultiplier),
    damage: Math.floor(type.damage * (1 + (wave - 1) * 0.05)),
    speed: type.speed,
    pattern: type.pattern
  }
}

export const createBoss = (
  type: EnemyType,
  x: number,
  y: number,
  wave: number
): Entity => {
  return {
    id: `boss-${Date.now()}`,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: type.radius,
    color: type.color,
    type: 'boss',
    subtype: type.id,
    hp: type.hp,
    maxHp: type.hp,
    damage: type.damage,
    speed: type.speed,
    pattern: type.pattern,
    attackCooldown: 0
  }
}