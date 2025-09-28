import React, { useRef, useEffect } from 'react'
import { useGameStore, Entity } from '../store/gameStore'
import { createExplosionParticles, createAbsorbParticles } from '../utils/particles'
import { soundManager } from '../utils/sound'
import { enemyTypes, bossTypes, getEnemiesForWave, getBossForWave, createEnemy, createBoss } from '../utils/enemies'
import { shootProjectile, updateProjectiles } from '../utils/weapons'
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
  
  const gameState = useGameStore(state => state.gameState)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
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
          projectiles.forEach(p => state.addEntity(p))
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
      
      // Background effect
      ctx.fillStyle = 'rgba(10, 10, 10, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
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
            const projectile: Entity = {
              id: `enemy-proj-${Date.now()}`,
              x: entity.x,
              y: entity.y,
              vx: Math.cos(angle) * 10,
              vy: Math.sin(angle) * 10,
              radius: 6,
              color: '#FF006E',
              type: 'projectile',
              damage: entity.damage,
              lifetime: 120
            }
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
              const projectile: Entity = {
                id: `boss-proj-${Date.now()}-${i}`,
                x: boss.x + Math.cos(spiralAngle) * 30,
                y: boss.y + Math.sin(spiralAngle) * 30,
                vx: Math.cos(spiralAngle) * 3,
                vy: Math.sin(spiralAngle) * 3,
                radius: 8,
                color: boss.color,
                type: 'projectile',
                damage: boss.damage! / 2,
                lifetime: 200
              }
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
      
      // Collision detection
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const e1 = entities[i]
          const e2 = entities[j]
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
                  
                  if (other.hp <= 0) {
                    soundManager.playGameOver()
                    state.setGameState('gameOver')
                  }
                }
                continue
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
                const enemies = state.entities.filter(e => e.type === 'enemy' || e.type === 'boss').length - 1
                if (enemies === 0) {
                  setTimeout(() => {
                    const newState = useGameStore.getState()
                    newState.wave = state.wave + 1
                    newState.triggerScreenShake(20)
                    soundManager.playMerge(newState.wave)
                  }, 100)
                }
              }
              continue
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
        }
      }
      
      if (player && player.damage) {
        player.damage--
      }
      
      // Update all entities
      entities.forEach(entity => {
        state.updateEntity(entity.id, entity)
      })
      
      state.updateParticles()
      state.updateScreenShake()
      
      // Render particles
      state.particles.forEach(particle => {
        ctx.save()
        ctx.globalAlpha = particle.life
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
      
      // Render entities
      entities.forEach(entity => {
        ctx.save()
        
        if (entity.type === 'player' && entity.damage && entity.damage > 0 && Math.floor(entity.damage / 5) % 2 === 0) {
          ctx.globalAlpha = 0.3
        }
        
        ctx.shadowColor = entity.color
        ctx.shadowBlur = entity.type === 'xp' ? 30 : 20
        
        if (entity.type === 'boss') {
          ctx.shadowBlur = 40
        }
        
        ctx.fillStyle = entity.color
        
        ctx.beginPath()
        ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2)
        ctx.fill()
        
        if (entity.type === 'player') {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.5
          ctx.stroke()
          
          const hpPercent = (entity.hp || 0) / (entity.maxHp || 1)
          ctx.fillStyle = '#FF006E'
          ctx.fillRect(entity.x - 20, entity.y - 30, 40, 4)
          ctx.fillStyle = '#06FFB4'
          ctx.fillRect(entity.x - 20, entity.y - 30, 40 * hpPercent, 4)
        }
        
        if ((entity.type === 'enemy' || entity.type === 'boss')) {
          const hpPercent = (entity.hp || 0) / (entity.maxHp || 1)
          ctx.fillStyle = 'rgba(255, 0, 110, 0.5)'
          ctx.fillRect(entity.x - entity.radius, entity.y - entity.radius - 10, entity.radius * 2, 4)
          ctx.fillStyle = '#FFBE0B'
          ctx.fillRect(entity.x - entity.radius, entity.y - entity.radius - 10, entity.radius * 2 * hpPercent, 4)
          
          if (entity.type === 'boss') {
            ctx.font = 'bold 14px Arial'
            ctx.fillStyle = '#fff'
            ctx.textAlign = 'center'
            ctx.fillText(bossTypes[entity.subtype!]?.name || 'BOSS', entity.x, entity.y - entity.radius - 20)
          }
        }
        
        if (entity.isCrit) {
          ctx.strokeStyle = '#FF006E'
          ctx.lineWidth = 2
          ctx.stroke()
        }
        
        ctx.restore()
      })
      
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