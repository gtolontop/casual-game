import { create } from 'zustand'

export interface Bubble {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  level: number
  isPlayer?: boolean
}

interface GameState {
  bubbles: Bubble[]
  score: number
  highScore: number
  gameState: 'menu' | 'playing' | 'gameOver'
  playerSize: number
  combo: number
  particles: Particle[]
  screenShake: number
  addBubble: (bubble: Bubble) => void
  removeBubble: (id: string) => void
  updateBubble: (id: string, updates: Partial<Bubble>) => void
  setScore: (score: number) => void
  setGameState: (state: 'menu' | 'playing' | 'gameOver') => void
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
}

export const useGameStore = create<GameState>((set, get) => ({
  bubbles: [],
  score: 0,
  highScore: parseInt(localStorage.getItem('highScore') || '0'),
  gameState: 'menu',
  playerSize: 30,
  combo: 0,
  particles: [],
  screenShake: 0,
  
  addBubble: (bubble) => set((state) => ({ 
    bubbles: [...state.bubbles, bubble] 
  })),
  
  removeBubble: (id) => set((state) => ({ 
    bubbles: state.bubbles.filter(b => b.id !== id) 
  })),
  
  updateBubble: (id, updates) => set((state) => ({
    bubbles: state.bubbles.map(b => b.id === id ? { ...b, ...updates } : b)
  })),
  
  setScore: (score) => set((state) => {
    const newHighScore = Math.max(score, state.highScore)
    if (newHighScore > state.highScore) {
      localStorage.setItem('highScore', newHighScore.toString())
    }
    return { score, highScore: newHighScore }
  }),
  
  setGameState: (gameState) => set({ gameState }),
  
  incrementCombo: () => set((state) => ({ combo: state.combo + 1 })),
  
  resetCombo: () => set({ combo: 0 }),
  
  addParticles: (newParticles) => set((state) => ({ 
    particles: [...state.particles, ...newParticles] 
  })),
  
  updateParticles: () => set((state) => ({
    particles: state.particles
      .map(p => ({ ...p, life: p.life - 0.02, x: p.x + p.vx, y: p.y + p.vy }))
      .filter(p => p.life > 0)
  })),
  
  triggerScreenShake: (intensity) => set({ screenShake: intensity }),
  
  updateScreenShake: () => set((state) => ({ 
    screenShake: Math.max(0, state.screenShake * 0.9) 
  })),
  
  reset: () => set({
    bubbles: [],
    score: 0,
    combo: 0,
    particles: [],
    screenShake: 0,
    playerSize: 30
  })
}))