import { create } from 'zustand'

export interface Entity {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  hp?: number
  maxHp?: number
  damage?: number
  speed?: number
  type: 'player' | 'enemy' | 'xp' | 'powerup' | 'projectile'
  subtype?: string
  lifetime?: number
  target?: { x: number; y: number }
}

export interface PowerUp {
  id: string
  name: string
  description: string
  icon: string
  level: number
  maxLevel: number
}

interface GameState {
  entities: Entity[]
  score: number
  highScore: number
  gameState: 'menu' | 'playing' | 'gameOver' | 'levelUp'
  wave: number
  xp: number
  xpToNext: number
  playerLevel: number
  combo: number
  particles: Particle[]
  screenShake: number
  powerUps: PowerUp[]
  availableUpgrades: PowerUp[]
  playerStats: {
    maxHp: number
    moveSpeed: number
    fireRate: number
    damage: number
    projectileSpeed: number
    pickupRange: number
    critChance: number
  }
  
  addEntity: (entity: Entity) => void
  removeEntity: (id: string) => void
  updateEntity: (id: string, updates: Partial<Entity>) => void
  setScore: (score: number) => void
  setGameState: (state: 'menu' | 'playing' | 'gameOver' | 'levelUp') => void
  addXp: (amount: number) => void
  levelUp: () => void
  selectUpgrade: (upgradeId: string) => void
  incrementCombo: () => void
  resetCombo: () => void
  addParticles: (particles: Particle[]) => void
  updateParticles: () => void
  triggerScreenShake: (intensity: number) => void
  updateScreenShake: () => void
  reset: () => void
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  color: string
  type?: 'damage' | 'heal' | 'xp'
}

const initialPowerUps: PowerUp[] = [
  { id: 'damage', name: 'Damage Up', description: '+20% damage', icon: '⚔️', level: 0, maxLevel: 5 },
  { id: 'speed', name: 'Speed Up', description: '+15% movement speed', icon: '👟', level: 0, maxLevel: 5 },
  { id: 'hp', name: 'Max HP', description: '+25 max health', icon: '❤️', level: 0, maxLevel: 5 },
  { id: 'firerate', name: 'Fire Rate', description: '+20% attack speed', icon: '🔥', level: 0, maxLevel: 5 },
  { id: 'multishot', name: 'Multishot', description: 'Fire additional projectiles', icon: '💫', level: 0, maxLevel: 3 },
  { id: 'lifesteal', name: 'Lifesteal', description: 'Heal on enemy kill', icon: '🩸', level: 0, maxLevel: 3 },
  { id: 'explosive', name: 'Explosive Shots', description: 'Projectiles explode on impact', icon: '💥', level: 0, maxLevel: 3 },
  { id: 'shield', name: 'Shield', description: 'Periodic damage immunity', icon: '🛡️', level: 0, maxLevel: 3 }
]

export const useGameStore = create<GameState>((set, get) => ({
  entities: [],
  score: 0,
  highScore: parseInt(localStorage.getItem('voidHighScore') || '0'),
  gameState: 'menu',
  wave: 1,
  xp: 0,
  xpToNext: 100,
  playerLevel: 1,
  combo: 0,
  particles: [],
  screenShake: 0,
  powerUps: [...initialPowerUps],
  availableUpgrades: [],
  playerStats: {
    maxHp: 100,
    moveSpeed: 5,
    fireRate: 2,
    damage: 10,
    projectileSpeed: 8,
    pickupRange: 50,
    critChance: 0.1
  },
  
  addEntity: (entity) => set((state) => ({ 
    entities: [...state.entities, entity] 
  })),
  
  removeEntity: (id) => set((state) => ({ 
    entities: state.entities.filter(e => e.id !== id) 
  })),
  
  updateEntity: (id, updates) => set((state) => ({
    entities: state.entities.map(e => e.id === id ? { ...e, ...updates } : e)
  })),
  
  setScore: (score) => set((state) => {
    const newHighScore = Math.max(score, state.highScore)
    if (newHighScore > state.highScore) {
      localStorage.setItem('voidHighScore', newHighScore.toString())
    }
    return { score, highScore: newHighScore }
  }),
  
  setGameState: (gameState) => set({ gameState }),
  
  addXp: (amount) => set((state) => {
    let newXp = state.xp + amount
    let xpForNext = state.xpToNext
    
    // Check if we should level up
    while (newXp >= xpForNext) {
      newXp = newXp - xpForNext
      get().levelUp()
      xpForNext = get().xpToNext
    }
    
    return { xp: newXp }
  }),
  
  levelUp: () => {
    const state = get()
    const availableUpgrades = state.powerUps
      .filter(p => p.level < p.maxLevel)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    
    if (availableUpgrades.length > 0) {
      set({
        playerLevel: state.playerLevel + 1,
        xpToNext: state.xpToNext + 50,
        gameState: 'levelUp',
        availableUpgrades
      })
    } else {
      // If no upgrades available, just increase level
      set({
        playerLevel: state.playerLevel + 1,
        xpToNext: state.xpToNext + 50
      })
    }
  },
  
  selectUpgrade: (upgradeId) => set((state) => {
    const upgradedPowerUps = state.powerUps.map(p => 
      p.id === upgradeId ? { ...p, level: p.level + 1 } : p
    )
    
    let newStats = { ...state.playerStats }
    const player = state.entities.find(e => e.type === 'player')
    
    switch(upgradeId) {
      case 'damage':
        newStats.damage = Math.round(newStats.damage * 1.2)
        break
      case 'speed':
        newStats.moveSpeed = newStats.moveSpeed * 1.15
        break
      case 'hp':
        newStats.maxHp += 25
        if (player) {
          player.maxHp = newStats.maxHp
          player.hp = Math.min((player.hp || 0) + 25, newStats.maxHp)
        }
        break
      case 'firerate':
        newStats.fireRate = newStats.fireRate * 1.2
        break
      case 'multishot':
        // Handled in shooting logic
        break
      case 'lifesteal':
        // Will add healing on kill
        break
      case 'explosive':
        // Will add explosion damage
        break
      case 'shield':
        // Will add periodic immunity
        break
    }
    
    return {
      powerUps: upgradedPowerUps,
      playerStats: newStats,
      gameState: 'playing',
      availableUpgrades: [],
      entities: player ? state.entities.map(e => e.id === 'player' ? player : e) : state.entities
    }
  }),
  
  incrementCombo: () => set((state) => ({ combo: state.combo + 1 })),
  
  resetCombo: () => set({ combo: 0 }),
  
  addParticles: (newParticles) => set((state) => ({ 
    particles: [...state.particles, ...newParticles] 
  })),
  
  updateParticles: () => set((state) => ({
    particles: state.particles
      .map(p => ({ 
        ...p, 
        life: p.life - 0.02, 
        x: p.x + p.vx, 
        y: p.y + p.vy,
        vy: p.vy + 0.2
      }))
      .filter(p => p.life > 0)
  })),
  
  triggerScreenShake: (intensity) => set({ screenShake: intensity }),
  
  updateScreenShake: () => set((state) => ({ 
    screenShake: Math.max(0, state.screenShake * 0.9) 
  })),
  
  reset: () => set({
    entities: [],
    score: 0,
    wave: 1,
    xp: 0,
    xpToNext: 100,
    playerLevel: 1,
    combo: 0,
    particles: [],
    screenShake: 0,
    powerUps: [...initialPowerUps],
    availableUpgrades: [],
    playerStats: {
      maxHp: 100,
      moveSpeed: 5,
      fireRate: 2,
      damage: 10,
      projectileSpeed: 8,
      pickupRange: 50,
      critChance: 0.1
    }
  })
}))