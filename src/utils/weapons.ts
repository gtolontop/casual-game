import { Entity } from '../store/gameStore'
import { soundManager } from './sound'

export const shootProjectile = (
  player: Entity,
  target: Entity | null,
  weapon: any,
  state: any,
  currentTime: number
) => {
  if (!target) return []
  
  const projectiles: Entity[] = []
  const angle = Math.atan2(target.y - player.y, target.x - player.x)
  
  // Critical hit check
  const isCrit = Math.random() < state.playerStats.critChance
  const damage = weapon.damage * (isCrit ? state.playerStats.critDamage : 1)
  
  // Double tap legendary
  const doubleTap = state.powerUps.find((p: any) => p.id === 'double')?.level || 0
  const shootTwice = doubleTap > 0 && Math.random() < 0.25
  
  const createProjectile = (index: number, angleOffset: number = 0) => ({
    id: `proj-${currentTime}-${index}`,
    x: player.x,
    y: player.y,
    vx: Math.cos(angle + angleOffset) * weapon.projectileSpeed,
    vy: Math.sin(angle + angleOffset) * weapon.projectileSpeed,
    radius: isCrit ? 6 : 4,
    color: isCrit ? '#FF006E' : '#00F5FF',
    type: 'projectile' as const,
    damage,
    lifetime: 60,
    isCrit
  })
  
  switch (weapon.pattern) {
    case 'single':
      projectiles.push(createProjectile(0))
      break
      
    case 'spread':
      for (let i = 0; i < weapon.projectileCount; i++) {
        const spreadAngle = (i - (weapon.projectileCount - 1) / 2) * 0.15
        projectiles.push(createProjectile(i, spreadAngle))
      }
      break
      
    case 'burst':
      for (let i = 0; i < weapon.projectileCount; i++) {
        const burst = createProjectile(i)
        burst.lifetime = 40 + i * 5
        burst.vx *= 1 + i * 0.1
        burst.vy *= 1 + i * 0.1
        projectiles.push(burst)
      }
      break
      
    case 'beam':
      for (let i = 0; i < 5; i++) {
        const beam = createProjectile(i)
        beam.x += Math.cos(angle) * i * 10
        beam.y += Math.sin(angle) * i * 10
        beam.radius = 8 - i
        beam.lifetime = 20
        projectiles.push(beam)
      }
      break
      
    case 'orbit':
      for (let i = 0; i < weapon.projectileCount; i++) {
        const orbitAngle = (Math.PI * 2 * i) / weapon.projectileCount
        const orb = createProjectile(i)
        orb.x = player.x + Math.cos(orbitAngle) * 50
        orb.y = player.y + Math.sin(orbitAngle) * 50
        orb.pattern = 'orbit'
        orb.lifetime = 180
        projectiles.push(orb)
      }
      break
      
    case 'homing':
      const homing = createProjectile(0)
      homing.target = { x: target.x, y: target.y }
      homing.pattern = 'homing'
      projectiles.push(homing)
      break
  }
  
  // Multishot upgrade
  const multishot = state.powerUps.find((p: any) => p.id === 'multishot')?.level || 0
  if (multishot > 0) {
    const extraProjs = []
    for (let i = 0; i < multishot; i++) {
      projectiles.forEach((proj, idx) => {
        if (idx === 0) {
          const extra = { ...proj }
          extra.id = `${proj.id}-multi-${i}`
          const offsetAngle = (i + 1) * 0.2 * (i % 2 === 0 ? 1 : -1)
          extra.vx = Math.cos(angle + offsetAngle) * weapon.projectileSpeed
          extra.vy = Math.sin(angle + offsetAngle) * weapon.projectileSpeed
          extraProjs.push(extra)
        }
      })
    }
    projectiles.push(...extraProjs)
  }
  
  // Double tap
  if (shootTwice) {
    setTimeout(() => {
      const secondShot = projectiles.map((p, i) => ({
        ...p,
        id: `${p.id}-double`
      }))
      secondShot.forEach(p => state.addEntity(p))
      soundManager.playTone(900, 0.05, 0.1)
    }, 100)
  }
  
  // Sound effects
  if (isCrit) {
    soundManager.playTone(1200, 0.1, 0.3)
  } else {
    soundManager.playTone(800, 0.05, 0.1)
  }
  
  return projectiles
}

export const updateProjectiles = (entities: Entity[], state: any) => {
  entities
    .filter(e => e.type === 'projectile')
    .forEach(projectile => {
      if (projectile.pattern === 'orbit') {
        const player = entities.find(e => e.type === 'player')
        if (player) {
          const angle = Math.atan2(projectile.y - player.y, projectile.x - player.x)
          const newAngle = angle + 0.1
          projectile.x = player.x + Math.cos(newAngle) * 50
          projectile.y = player.y + Math.sin(newAngle) * 50
        }
      } else if (projectile.pattern === 'homing' && projectile.target) {
        const nearest = entities
          .filter(e => e.type === 'enemy')
          .sort((a, b) => {
            const distA = Math.hypot(a.x - projectile.x, a.y - projectile.y)
            const distB = Math.hypot(b.x - projectile.x, b.y - projectile.y)
            return distA - distB
          })[0]
          
        if (nearest) {
          projectile.target = { x: nearest.x, y: nearest.y }
          const angle = Math.atan2(projectile.target.y - projectile.y, projectile.target.x - projectile.x)
          const speed = Math.hypot(projectile.vx, projectile.vy)
          projectile.vx = projectile.vx * 0.9 + Math.cos(angle) * speed * 0.1
          projectile.vy = projectile.vy * 0.9 + Math.sin(angle) * speed * 0.1
        }
      } else {
        projectile.x += projectile.vx
        projectile.y += projectile.vy
      }
      
      projectile.lifetime = (projectile.lifetime || 0) - 1
    })
}