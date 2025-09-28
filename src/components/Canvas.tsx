import React, { useRef, useEffect } from 'react'
import { useGameStore, Entity } from '../store/gameStore'
import { createExplosionParticles, createAbsorbParticles } from '../utils/particles'
import { soundManager } from '../utils/sound'
import { enemyTypes, bossTypes, getEnemiesForWave, getBossForWave, createEnemy, createBoss } from '../utils/enemies'
import { shootProjectile, updateProjectiles } from '../utils/weapons'
import { OptimizedRenderer } from '../utils/renderer'
import { ObjectPool, SpatialGrid } from '../utils/objectPool'
import './Canvas.css'

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const gameInitialized = useRef(false)
  const lastShootTime = useRef(0)
  const enemySpawnTime = useRef(0)
  const lastShieldTime = useRef(0)
  const killCount = useRef(0)
  const rendererRef = useRef<OptimizedRenderer | null>(null)
  const spatialGridRef = useRef<SpatialGrid<Entity>>(new SpatialGrid(150))
  const projectilePoolRef = useRef<ObjectPool<Entity>>(new ObjectPool(
    () => ({
      id: '',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 4,
      color: '#00F5FF',
      type: 'projectile' as const,
      damage: 10,
      lifetime: 0
    }),
    (p) => {
      p.id = ''
      p.x = 0
      p.y = 0
      p.vx = 0
      p.vy = 0
      p.lifetime = 0
      p.damage = 10
      p.isCrit = false
    },
    100
  ))
  
  const gameState = useGameStore(state => state.gameState)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      if (rendererRef.current) {
        rendererRef.current.resize(canvas.width, canvas.height)
      }
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Initialize renderer
    if (!rendererRef.current) {
      rendererRef.current = new OptimizedRenderer(ctx, canvas.width, canvas.height)
    }
    
    if (gameState === 'menu' || gameState === 'gameOver') {
      gameInitialized.current = false
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return () => {
        window.removeEventListener('resize', resizeCanvas)
      }
    }
    
    if (gameState === 'levelUp' || gameState === 'bossWarning') {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.5)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return () => {
        window.removeEventListener('resize', resizeCanvas)
      }
    }
    
    const state = useGameStore.getState()
    
    if (!gameInitialized.current && gameState === 'playing') {
      gameInitialized.current = true
      
      if (state.entities.length === 0) {
        state.reset()
        killCount.current = 0
        
        const player: Entity = {
          id: 'player',
          x: canvas.width / 2,
          y: canvas.height / 2,
          vx: 0,
          vy: 0,
          radius: 15,
          color: '#00F5FF',
          type: 'player',
          hp: state.playerStats.maxHp,
          maxHp: state.playerStats.maxHp
        }
        
        state.addEntity(player)
      }
    }
    
    const spawnEnemy = (currentTime: number) => {
      const state = useGameStore.getState()
      const enemies = state.entities.filter(e => e.type === 'enemy')
      const boss = state.entities.find(e => e.type === 'boss')
      
      if (boss) return // Don't spawn enemies during boss fight
      
      // Check for boss spawn
      if (state.wave % 5 === 0 && enemies.length === 0 && !boss) {
        const bossType = getBossForWave(state.wave)
        if (bossType && !state.entities.find(e => e.type === 'boss')) {
          state.setGameState('bossWarning')
          setTimeout(() => {
            const currentState = useGameStore.getState()
            if (!currentState.entities.find(e => e.type === 'boss')) {
              const boss = createBoss(bossType, canvas.width / 2, -100, state.wave)
              currentState.addEntity(boss)
              currentState.setGameState('playing')
              soundManager.playTone(200, 0.5, 0.5)
            }
          }, 2000)
          return
        }
      }
      
      const spawnDelay = Math.max(500, 2000 - state.wave * 50)
      const maxEnemies = Math.min(20, 8 + state.wave)
      
      if (currentTime - enemySpawnTime.current > spawnDelay && enemies.length < maxEnemies) {
        enemySpawnTime.current = currentTime
        
        const enemyPool = getEnemiesForWave(state.wave)
        const enemyTypeId = enemyPool[Math.floor(Math.random() * enemyPool.length)]
        const enemyType = enemyTypes[enemyTypeId]
        
        const angle = Math.random() * Math.PI * 2
        const distance = 400 + Math.random() * 200
        
        // Swarm spawning
        if (enemyTypeId === 'swarm') {
          for (let i = 0; i < 5; i++) {
            const swarmAngle = angle + (Math.random() - 0.5)
            const enemy = createEnemy(
              enemyType,
              canvas.width / 2 + Math.cos(swarmAngle) * distance,
              canvas.height / 2 + Math.sin(swarmAngle) * distance,
              state.wave
            )
            state.addEntity(enemy)
          }
        } else {
          const enemy = createEnemy(
            enemyType,
            canvas.width / 2 + Math.cos(angle) * distance,
            canvas.height / 2 + Math.sin(angle) * distance,
            state.wave
          )
          state.addEntity(enemy)
        }
      }
    }
    
    const shootProjectiles = (currentTime: number, player: Entity) => {
      const state = useGameStore.getState()
      const weapon = state.currentWeapon
      const shootDelay = 1000 / (weapon.fireRate * state.playerStats.fireRate / 2)
      
      if (currentTime - lastShootTime.current > shootDelay) {
        lastShootTime.current = currentTime
        
        const enemies = state.entities.filter(e => e.type === 'enemy' || e.type === 'boss')
        const nearest = enemies.reduce((nearest: Entity | null, enemy) => {
          if (!nearest) return enemy
          const distToNearest = Math.hypot(player.x - nearest.x, player.y - nearest.y)
          const distToEnemy = Math.hypot(player.x - enemy.x, player.y - enemy.y)
          return distToEnemy < distToNearest ? enemy : nearest
        }, null)
        
        if (nearest) {
          const projectiles = shootProjectile(player, nearest, weapon, state, currentTime)
          projectiles.forEach(p => {
            // Use object pool for projectiles
            const pooledProjectile = projectilePoolRef.current.get()
            Object.assign(pooledProjectile, p)
            state.addEntity(pooledProjectile)
          })
        }
      }
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    
    const gameLoop = () => {
      const state = useGameStore.getState()
      if (state.gameState !== 'playing') return
      
      const currentTime = Date.now()
      
      // Use optimized renderer clear
      rendererRef.current?.clear()
      
      // Clean up expired projectiles more efficiently
      const projectiles = state.entities.filter(e => e.type === 'projectile')
      if (projectiles.length > 40) {
        const toRemove = projectiles
          .sort((a, b) => (a.lifetime || 0) - (b.lifetime || 0))
          .slice(0, Math.max(5, projectiles.length - 40))
        toRemove.forEach(p => {
          state.removeEntity(p.id)
          projectilePoolRef.current.release(p)
        })
      }
      
      const entities = [...state.entities]
      const player = entities.find(e => e.type === 'player')
      
      // Player movement
      if (player) {
        const dx = mouseRef.current.x - player.x
        const dy = mouseRef.current.y - player.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > 5) {
          const speed = Math.min(distance / 10, state.playerStats.moveSpeed)
          player.vx += (dx / distance) * speed * 0.2
          player.vy += (dy / distance) * speed * 0.2
        }
        
        player.vx *= 0.9
        player.vy *= 0.9
        player.x += player.vx
        player.y += player.vy
        
        player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x))
        player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y))
        
        // Berserk mode
        const berserkLevel = state.powerUps.find(p => p.id === 'berserk')?.level || 0
        if (berserkLevel > 0 && player.hp! / player.maxHp! < 0.3) {
          ctx.save()
          ctx.globalAlpha = 0.3
          ctx.fillStyle = '#FF006E'
          ctx.beginPath()
          ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
        
        shootProjectiles(currentTime, player)
      }
      
      spawnEnemy(currentTime)
      
      // Update spatial grid
      spatialGridRef.current.clear()
      entities.forEach(e => spatialGridRef.current.add(e))
      
      // Update entities
      entities.forEach(entity => {
        if (entity.type === 'enemy' && player) {
          const timeDilation = state.powerUps.find(p => p.id === 'time')?.level || 0
          const slowFactor = timeDilation > 0 ? 0.7 : 1
          
          // Enemy patterns
          if (entity.pattern === 'dash' && entity.attackCooldown === 0) {
            const dist = Math.hypot(player.x - entity.x, player.y - entity.y)
            if (dist < 200) {
              entity.attackCooldown = 120
              const angle = Math.atan2(player.y - entity.y, player.x - entity.x)
              entity.vx = Math.cos(angle) * entity.speed! * 5
              entity.vy = Math.sin(angle) * entity.speed! * 5
            }
          } else if (entity.pattern === 'sniper' && entity.attackCooldown === 0 && Math.random() < 0.02) {
            entity.attackCooldown = 180
            const angle = Math.atan2(player.y - entity.y, player.x - entity.x)
            const projectile = projectilePoolRef.current.get()
            projectile.id = `enemy-proj-${Date.now()}`
            projectile.x = entity.x
            projectile.y = entity.y
            projectile.vx = Math.cos(angle) * 10
            projectile.vy = Math.sin(angle) * 10
            projectile.radius = 6
            projectile.color = '#FF006E'
            projectile.type = 'projectile'
            projectile.damage = entity.damage
            projectile.lifetime = 120
            state.addEntity(projectile)
            soundManager.playTone(400, 0.1, 0.2)
          } else {
            const dx = player.x - entity.x
            const dy = player.y - entity.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance > 0) {
              entity.vx = (dx / distance) * (entity.speed || 1) * slowFactor
              entity.vy = (dy / distance) * (entity.speed || 1) * slowFactor
            }
          }
          
          if (entity.attackCooldown) {
            entity.attackCooldown--
          }
          
          entity.x += entity.vx
          entity.y += entity.vy
        }
        
        if (entity.type === 'boss' && player) {
          // Boss patterns
          const boss = entity
          boss.attackCooldown = (boss.attackCooldown || 0) + 1
          
          if (boss.pattern === 'spiral' && boss.attackCooldown % 10 === 0) {
            const angle = (boss.attackCooldown / 10) * 0.5
            for (let i = 0; i < 4; i++) {
              const spiralAngle = angle + (Math.PI / 2) * i
              const projectile = projectilePoolRef.current.get()
              projectile.id = `boss-proj-${Date.now()}-${i}`
              projectile.x = boss.x + Math.cos(spiralAngle) * 30
              projectile.y = boss.y + Math.sin(spiralAngle) * 30
              projectile.vx = Math.cos(spiralAngle) * 3
              projectile.vy = Math.sin(spiralAngle) * 3
              projectile.radius = 8
              projectile.color = boss.color
              projectile.type = 'projectile'
              projectile.damage = boss.damage! / 2
              projectile.lifetime = 200
              state.addEntity(projectile)
            }
          }
          
          // Boss movement
          const targetY = canvas.height * 0.2
          if (boss.y < targetY) {
            boss.y += 2
          } else {
            boss.x += Math.sin(boss.attackCooldown * 0.02) * 2
          }
        }
        
        if (entity.type === 'xp') {
          if (player) {
            const dist = Math.hypot(player.x - entity.x, player.y - entity.y)
            if (dist < state.playerStats.pickupRange) {
              entity.vx = (player.x - entity.x) * 0.1
              entity.vy = (player.y - entity.y) * 0.1
            } else {
              entity.vx *= 0.95
              entity.vy *= 0.95
            }
            
            entity.x += entity.vx
            entity.y += entity.vy
          }
        }
      })
      
      // Update projectiles
      updateProjectiles(entities, state)
      
      // Optimized collision detection using spatial grid
      entities.forEach(e1 => {
        const nearby = spatialGridRef.current.getNearby(e1)
        nearby.forEach(e2 => {
          if (e1.id === e2.id || e1.id >= e2.id) return // Avoid duplicate checks
          const dist = Math.hypot(e1.x - e2.x, e1.y - e2.y)
          
          if (dist < e1.radius + e2.radius) {
            // Player vs Enemy
            if (e1.type === 'player' && (e2.type === 'enemy' || e2.type === 'boss')) {
              const dodgeRoll = Math.random()
              const dodged = dodgeRoll < state.playerStats.dodge
              
              if (dodged) {
                const dodgeParticles = createExplosionParticles(e1.x, e1.y, '#FFFFFF', 10)
                state.addParticles(dodgeParticles)
                soundManager.playTone(1500, 0.05, 0.1)
              } else {
                const shieldLevel = state.powerUps.find(p => p.id === 'shield')?.level || 0
                const shieldCooldown = 5000 - shieldLevel * 1000
                const isShielded = shieldLevel > 0 && currentTime - lastShieldTime.current > shieldCooldown
                
                if (isShielded) {
                  lastShieldTime.current = currentTime
                  const shieldParticles = createExplosionParticles(e1.x, e1.y, '#3A86FF', 15)
                  state.addParticles(shieldParticles)
                  soundManager.playTone(1200, 0.1, 0.3)
                } else if (!e1.damage) {
                  const damage = Math.max(1, (e2.damage || 10) - state.playerStats.armor)
                  e1.hp = (e1.hp || 0) - damage
                  e1.damage = 30
                  state.triggerScreenShake(10)
                  soundManager.playTone(200, 0.1, 0.3)
                  
                  if (e1.hp <= 0) {
                    soundManager.playGameOver()
                    state.setGameState('gameOver')
                  }
                }
              }
            }
            
            // Projectile vs Enemy/Player
            if (e1.type === 'projectile' || e2.type === 'projectile') {
              const projectile = e1.type === 'projectile' ? e1 : e2
              const other = e1.type === 'projectile' ? e2 : e1
              
              // Enemy projectile vs Player
              if ((projectile.id.includes('enemy') || projectile.id.includes('boss')) && other.type === 'player') {
                if (!other.damage) {
                  other.hp = (other.hp || 0) - (projectile.damage || 10)
                  other.damage = 30
                  state.triggerScreenShake(10)
                  soundManager.playTone(200, 0.1, 0.3)
                  state.removeEntity(projectile.id)
                if (projectile.type === 'projectile') {
                  projectilePoolRef.current.release(projectile)
                }
                  
                  if (other.hp <= 0) {
                    soundManager.playGameOver()
                    state.setGameState('gameOver')
                  }
                }
                return
              }
              
              // Player projectile vs Enemy
              if (!(projectile.id.includes('enemy') || projectile.id.includes('boss')) && (other.type === 'enemy' || other.type === 'boss')) {
                const enemy = other
              
              enemy.hp = (enemy.hp || 0) - (projectile.damage || 10)
              
              const explosion = createExplosionParticles(
                projectile.x, 
                projectile.y, 
                projectile.isCrit ? '#FF006E' : projectile.color, 
                projectile.isCrit ? 15 : 10
              )
              state.addParticles(explosion)
              
              state.removeEntity(projectile.id)
              if (projectile.type === 'projectile') {
                projectilePoolRef.current.release(projectile)
              }
              
              if (enemy.hp <= 0) {
                const bigExplosion = createExplosionParticles(enemy.x, enemy.y, enemy.color, 20)
                state.addParticles(bigExplosion)
                
                // Score and XP
                const enemyType = enemy.type === 'boss' ? 
                  bossTypes[enemy.subtype!] : 
                  enemyTypes[enemy.subtype!]
                  
                state.setScore(state.score + (enemyType?.scoreReward || 10))
                state.incrementCombo()
                killCount.current++
                
                // Nuclear option
                const nukeLevel = state.powerUps.find(p => p.id === 'nuke')?.level || 0
                if (nukeLevel > 0 && killCount.current % 100 === 0) {
                  state.entities
                    .filter(e => e.type === 'enemy')
                    .forEach(e => {
                      const nukeExplosion = createExplosionParticles(e.x, e.y, '#FFFF00', 30)
                      state.addParticles(nukeExplosion)
                      state.removeEntity(e.id)
                    })
                  state.triggerScreenShake(50)
                  soundManager.playTone(100, 0.5, 0.5)
                }
                
                // Lifesteal
                const lifestealLevel = state.powerUps.find(p => p.id === 'lifesteal')?.level || 0
                const vampireLevel = state.powerUps.find(p => p.id === 'vampire')?.level || 0
                
                if ((lifestealLevel > 0 || vampireLevel > 0) && player) {
                  const healAmount = lifestealLevel * 2 + vampireLevel * (projectile.damage || 10) * 0.02
                  player.hp = Math.min((player.hp || 0) + healAmount, player.maxHp || 100)
                  const healParticle = createAbsorbParticles(enemy.x, enemy.y, player.x, player.y, '#FF006E', 3)
                  state.addParticles(healParticle)
                }
                
                // Explosive shots
                const explosiveLevel = state.powerUps.find(p => p.id === 'explosive')?.level || 0
                if (explosiveLevel > 0) {
                  const explosionRadius = 50 + explosiveLevel * 20
                  const explosionDamage = state.playerStats.damage * 0.5
                  
                  state.entities
                    .filter(e => (e.type === 'enemy' || e.type === 'boss') && e.id !== enemy.id)
                    .forEach(otherEnemy => {
                      const dist = Math.hypot(otherEnemy.x - enemy.x, otherEnemy.y - enemy.y)
                      if (dist < explosionRadius) {
                        otherEnemy.hp = (otherEnemy.hp || 0) - explosionDamage
                        const dmgParticles = createExplosionParticles(otherEnemy.x, otherEnemy.y, '#FF006E', 5)
                        state.addParticles(dmgParticles)
                      }
                    })
                  
                  ctx.save()
                  ctx.strokeStyle = enemy.color
                  ctx.globalAlpha = 0.3
                  ctx.lineWidth = 3
                  ctx.beginPath()
                  ctx.arc(enemy.x, enemy.y, explosionRadius, 0, Math.PI * 2)
                  ctx.stroke()
                  ctx.restore()
                }
                
                // Drop XP
                const xpAmount = enemyType?.xpReward || 10
                const luckBonus = state.playerStats.luck
                
                for (let i = 0; i < Math.ceil(xpAmount / 10); i++) {
                  const xp: Entity = {
                    id: `xp-${Date.now()}-${i}`,
                    x: enemy.x + (Math.random() - 0.5) * 20,
                    y: enemy.y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    radius: 6 + (Math.random() < 0.1 * luckBonus ? 4 : 0),
                    color: Math.random() < 0.1 * luckBonus ? '#FFD700' : '#06FFB4',
                    type: 'xp'
                  }
                  state.addEntity(xp)
                }
                
                soundManager.playPop()
                state.triggerScreenShake(enemy.type === 'boss' ? 20 : 5)
                
                state.removeEntity(enemy.id)
                
                // Check wave completion
                const remainingEnemies = state.entities.filter(e => (e.type === 'enemy' || e.type === 'boss') && e.id !== enemy.id).length
                if (remainingEnemies === 0) {
                  // Small delay to prevent double wave increment
                  setTimeout(() => {
                    const newState = useGameStore.getState()
                    const currentEnemies = newState.entities.filter(e => e.type === 'enemy' || e.type === 'boss').length
                    if (currentEnemies === 0) {
                      const newWave = newState.wave + 1
                      // Update state directly to avoid race conditions
                      useGameStore.setState({ wave: newWave })
                      newState.triggerScreenShake(20)
                      soundManager.playMerge(newWave)
                    }
                  }, 500)
                }
              }
              return
            }
            }
            
            // Player vs XP
            if (e1.type === 'player' && e2.type === 'xp') {
              const particles = createAbsorbParticles(e2.x, e2.y, e1.x, e1.y, e2.color, 5)
              state.addParticles(particles)
              const xpValue = e2.radius > 8 ? 50 : 10
              state.addXp(xpValue)
              soundManager.playTone(1000, 0.05, 0.2)
              state.removeEntity(e2.id)
            }
          }
        })
      })
      
      if (player && player.damage) {
        player.damage--
      }
      
      // Update all entities
      entities.forEach(entity => {
        state.updateEntity(entity.id, entity)
      })
      
      state.updateParticles()
      state.updateScreenShake()
      
      // Use optimized batch rendering
      if (rendererRef.current) {
        // Render particles
        rendererRef.current.renderParticlesBatch(state.particles.slice(-100))
        
        // Render entities
        rendererRef.current.renderEntitiesBatch(entities)
        
        // Render health bars separately
        rendererRef.current.renderHealthBars(entities)
        
        // Render boss names
        entities.filter(e => e.type === 'boss').forEach(boss => {
          ctx.font = 'bold 14px Arial'
          ctx.fillStyle = '#fff'
          ctx.textAlign = 'center'
          ctx.fillText(bossTypes[boss.subtype!]?.name || 'BOSS', boss.x, boss.y - boss.radius - 20)
        })
      }
      
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    
    animationRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState])
  
  return <canvas ref={canvasRef} className="game-canvas" />
}

export default Canvas