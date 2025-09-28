import { Particle } from '../store/gameStore'

export const createExplosionParticles = (
  x: number, 
  y: number, 
  color: string, 
  count: number = 20
): Particle[] => {
  const particles: Particle[] = []
  // Reduce particle count for performance
  const actualCount = Math.min(count, 15)
  
  for (let i = 0; i < actualCount; i++) {
    const angle = (Math.PI * 2 * i) / count
    const speed = 2 + Math.random() * 5
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: 2 + Math.random() * 4,
      color
    })
  }
  
  return particles
}

export const createAbsorbParticles = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  count: number = 10
): Particle[] => {
  const particles: Particle[] = []
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * 30
    particles.push({
      x: fromX + Math.cos(angle) * distance,
      y: fromY + Math.sin(angle) * distance,
      vx: (toX - fromX) / 20 + (Math.random() - 0.5) * 2,
      vy: (toY - fromY) / 20 + (Math.random() - 0.5) * 2,
      life: 0.5,
      size: 1 + Math.random() * 3,
      color
    })
  }
  
  return particles
}

export const createTrailParticles = (
  x: number,
  y: number,
  vx: number,
  vy: number,
  color: string
): Particle[] => {
  const speed = Math.sqrt(vx * vx + vy * vy)
  if (speed < 1) return []
  
  return [{
    x: x - vx * 2,
    y: y - vy * 2,
    vx: -vx * 0.1 + (Math.random() - 0.5),
    vy: -vy * 0.1 + (Math.random() - 0.5),
    life: 0.3,
    size: 2 + Math.random() * 2,
    color
  }]
}