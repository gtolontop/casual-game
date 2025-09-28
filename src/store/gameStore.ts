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
  type: 'player' | 'enemy' | 'xp' | 'powerup' | 'projectile' | 'boss'
  subtype?: string
  lifetime?: number
  target?: { x: number; y: number }
  pattern?: string
  attackCooldown?: number
  isCrit?: boolean
}

export interface PowerUp {
  id: string
  name: string
  description: string
  icon: string
  level: number
  maxLevel: number
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface Weapon {
  id: string
  name: string
  damage: number
  fireRate: number
  projectileSpeed: number
  pattern: 'single' | 'spread' | 'burst' | 'beam' | 'orbit' | 'homing'
  projectileCount: number
  icon: string
}

interface GameState {
  entities: Entity[]
  score: number
  highScore: number
  gameState: 'menu' | 'playing' | 'gameOver' | 'levelUp' | 'bossWarning'
  wave: number
  xp: number
  xpToNext: number
  playerLevel: number
  combo: number
  particles: Particle[]
  screenShake: number
  powerUps: PowerUp[]
  availableUpgrades: PowerUp[]
  currentWeapon: Weapon
  unlockedWeapons: Weapon[]
  playerStats: {
    maxHp: number
    moveSpeed: number
    fireRate: number
    damage: number
    projectileSpeed: number
    pickupRange: number
    critChance: number
    critDamage: number
    luck: number
    dodge: number
    armor: number
    dashCooldown: number
    rageBar: number
    comboMultiplier: number
  }
  killStreak: number
  totalKills: number
  dashReady: boolean
  
  addEntity: (entity: Entity) => void
  removeEntity: (id: string) => void
  updateEntity: (id: string, updates: Partial<Entity>) => void
  setScore: (score: number) => void
  setGameState: (state: 'menu' | 'playing' | 'gameOver' | 'levelUp' | 'bossWarning') => void
  addXp: (amount: number) => void
  levelUp: () => void
  selectUpgrade: (upgradeId: string) => void
  switchWeapon: (weaponId: string) => void
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
  type?: 'damage' | 'heal' | 'xp' | 'crit'
}

const weapons: Weapon[] = [
  { id: 'pistol', name: 'Plasma Pistol', damage: 10, fireRate: 2, projectileSpeed: 8, pattern: 'single', projectileCount: 1, icon: '🔫' },
  { id: 'shotgun', name: 'Void Shotgun', damage: 5, fireRate: 1.5, projectileSpeed: 7, pattern: 'spread', projectileCount: 5, icon: '🔨' },
  { id: 'rifle', name: 'Laser Rifle', damage: 15, fireRate: 4, projectileSpeed: 12, pattern: 'burst', projectileCount: 3, icon: '⚡' },
  { id: 'cannon', name: 'Ion Cannon', damage: 50, fireRate: 0.5, projectileSpeed: 6, pattern: 'single', projectileCount: 1, icon: '💥' },
  { id: 'beam', name: 'Death Beam', damage: 5, fireRate: 10, projectileSpeed: 20, pattern: 'beam', projectileCount: 1, icon: '🌟' },
  { id: 'orb', name: 'Orbital Spheres', damage: 8, fireRate: 3, projectileSpeed: 5, pattern: 'orbit', projectileCount: 4, icon: '🌀' }
]

const initialPowerUps: PowerUp[] = [
  // Common
  { id: 'damage', name: 'Damage Up', description: '+20% damage', icon: '⚔️', level: 0, maxLevel: 10, rarity: 'common' },
  { id: 'speed', name: 'Speed Up', description: '+15% movement speed', icon: '👟', level: 0, maxLevel: 8, rarity: 'common' },
  { id: 'hp', name: 'Max HP', description: '+25 max health', icon: '❤️', level: 0, maxLevel: 10, rarity: 'common' },
  { id: 'firerate', name: 'Fire Rate', description: '+20% attack speed', icon: '🔥', level: 0, maxLevel: 8, rarity: 'common' },
  
  // Rare
  { id: 'multishot', name: 'Multishot', description: 'Fire additional projectiles', icon: '💫', level: 0, maxLevel: 5, rarity: 'rare' },
  { id: 'lifesteal', name: 'Lifesteal', description: 'Heal on enemy kill', icon: '🩸', level: 0, maxLevel: 5, rarity: 'rare' },
  { id: 'crit', name: 'Critical Strike', description: '+10% crit chance', icon: '⚡', level: 0, maxLevel: 5, rarity: 'rare' },
  { id: 'dodge', name: 'Evasion', description: '+5% dodge chance', icon: '💨', level: 0, maxLevel: 5, rarity: 'rare' },
  
  // Epic
  { id: 'explosive', name: 'Explosive Shots', description: 'Projectiles explode on impact', icon: '💥', level: 0, maxLevel: 3, rarity: 'epic' },
  { id: 'shield', name: 'Shield', description: 'Periodic damage immunity', icon: '🛡️', level: 0, maxLevel: 3, rarity: 'epic' },
  { id: 'luck', name: 'Lucky Charm', description: '+20% rare drop chance', icon: '🍀', level: 0, maxLevel: 3, rarity: 'epic' },
  { id: 'vampire', name: 'Vampirism', description: '2% lifesteal on all damage', icon: '🦇', level: 0, maxLevel: 3, rarity: 'epic' },
  
  // Legendary
  { id: 'berserk', name: 'Berserker Mode', description: 'Double damage when < 30% HP', icon: '👹', level: 0, maxLevel: 1, rarity: 'legendary' },
  { id: 'time', name: 'Time Dilation', description: 'Enemies move 30% slower', icon: '⏱️', level: 0, maxLevel: 1, rarity: 'legendary' },
  { id: 'double', name: 'Double Tap', description: '25% chance to shoot twice', icon: '✌️', level: 0, maxLevel: 1, rarity: 'legendary' },
  { id: 'nuke', name: 'Nuclear Option', description: 'Clear screen every 100 kills', icon: '☢️', level: 0, maxLevel: 1, rarity: 'legendary' }
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
  currentWeapon: weapons[0],
  unlockedWeapons: [weapons[0]],
  playerStats: {
    maxHp: 100,
    moveSpeed: 5,
    fireRate: 2,
    damage: 10,
    projectileSpeed: 8,
    pickupRange: 50,
    critChance: 0.1,
    critDamage: 2,
    luck: 1,
    dodge: 0,
    armor: 0,
    dashCooldown: 3000,
    rageBar: 0,
    comboMultiplier: 1
  },
  killStreak: 0,
  totalKills: 0,
  dashReady: true,
  
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
    
    while (newXp >= xpForNext) {
      newXp = newXp - xpForNext
      get().levelUp()
      xpForNext = get().xpToNext
    }
    
    return { xp: newXp }
  }),
  
  levelUp: () => {
    const state = get()
    
    // Weighted random based on rarity and luck
    const rollUpgrade = () => {
      const roll = Math.random() * 100
      const luckBonus = state.playerStats.luck * 5
      
      if (roll < 5 + luckBonus) return 'legendary'
      if (roll < 20 + luckBonus) return 'epic'
      if (roll < 50 + luckBonus) return 'rare'
      return 'common'
    }
    
    // Get 3 upgrades with at least one guaranteed rare+
    const upgrades = []
    const rarities = ['rare', rollUpgrade(), rollUpgrade()]
    
    rarities.forEach(rarity => {
      const available = state.powerUps.filter(p => 
        p.level < p.maxLevel && p.rarity === rarity
      )
      if (available.length > 0) {
        const upgrade = available[Math.floor(Math.random() * available.length)]
        if (!upgrades.find(u => u.id === upgrade.id)) {
          upgrades.push(upgrade)
        }
      }
    })
    
    // Fill with commons if needed
    while (upgrades.length < 3) {
      const commons = state.powerUps.filter(p => 
        p.level < p.maxLevel && !upgrades.find(u => u.id === p.id)
      )
      if (commons.length > 0) {
        upgrades.push(commons[Math.floor(Math.random() * commons.length)])
      } else break
    }
    
    // Weapon unlock every 5 levels
    if (state.playerLevel % 5 === 4 && state.unlockedWeapons.length < weapons.length) {
      const locked = weapons.filter(w => !state.unlockedWeapons.find(uw => uw.id === w.id))
      if (locked.length > 0) {
        const newWeapon = locked[Math.floor(Math.random() * locked.length)]
        set({ unlockedWeapons: [...state.unlockedWeapons, newWeapon] })
      }
    }
    
    if (upgrades.length > 0) {
      set({
        playerLevel: state.playerLevel + 1,
        xpToNext: state.xpToNext + 50,
        gameState: 'levelUp',
        availableUpgrades: upgrades
      })
    }
  },
  
  selectUpgrade: (upgradeId) => set((state) => {
    const upgradedPowerUps = state.powerUps.map(p => 
      p.id === upgradeId ? { ...p, level: p.level + 1 } : p
    )
    
    let newStats = { ...state.playerStats }
    const player = state.entities.find(e => e.type === 'player')
    const weapon = state.currentWeapon
    
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
      case 'crit':
        newStats.critChance += 0.1
        break
      case 'dodge':
        newStats.dodge += 0.05
        break
      case 'luck':
        newStats.luck += 0.2
        break
    }
    
    // Update weapon stats
    if (weapon) {
      weapon.damage = newStats.damage
      weapon.fireRate = newStats.fireRate
    }
    
    return {
      powerUps: upgradedPowerUps,
      playerStats: newStats,
      gameState: 'playing',
      availableUpgrades: [],
      currentWeapon: weapon,
      entities: player ? state.entities.map(e => e.id === 'player' ? player : e) : state.entities
    }
  }),
  
  switchWeapon: (weaponId) => set((state) => {
    const weapon = state.unlockedWeapons.find(w => w.id === weaponId)
    if (weapon) {
      return { 
        currentWeapon: {
          ...weapon,
          damage: state.playerStats.damage,
          fireRate: state.playerStats.fireRate
        }
      }
    }
    return {}
  }),
  
  incrementCombo: () => set((state) => {
    const newKillStreak = state.killStreak + 1
    const newComboMultiplier = 1 + Math.floor(newKillStreak / 10) * 0.5
    const newRage = Math.min(state.playerStats.rageBar + 5, 100)
    
    return { 
      combo: state.combo + 1,
      killStreak: newKillStreak,
      totalKills: state.totalKills + 1,
      playerStats: {
        ...state.playerStats,
        comboMultiplier: newComboMultiplier,
        rageBar: newRage
      }
    }
  }),
  
  resetCombo: () => set((state) => ({ 
    combo: 0, 
    killStreak: 0,
    playerStats: {
      ...state.playerStats,
      comboMultiplier: 1
    }
  })),
  
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
    currentWeapon: weapons[0],
    unlockedWeapons: [weapons[0]],
    playerStats: {
      maxHp: 100,
      moveSpeed: 5,
      fireRate: 2,
      damage: 10,
      projectileSpeed: 8,
      pickupRange: 50,
      critChance: 0.1,
      critDamage: 2,
      luck: 1,
      dodge: 0,
      armor: 0,
      dashCooldown: 3000,
      rageBar: 0,
      comboMultiplier: 1
    },
    killStreak: 0,
    totalKills: 0,
    dashReady: true
  })
}))