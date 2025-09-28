import React, { useRef, useEffect } from 'react'
import { useGameStore, Entity } from '../store/gameStore'
import { createExplosionParticles, createAbsorbParticles } from '../utils/particles'
import { soundManager } from '../utils/sound'
import './Canvas.css'

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const gameInitialized = useRef(false)
  const lastShootTime = useRef(0)
  const enemySpawnTime = useRef(0)
  
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
    
    if (gameState === 'menu' || gameState === 'gameOver' || gameState === 'levelUp') {
      gameInitialized.current = false
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return () => {
        window.removeEventListener('resize', resizeCanvas)
      }
    }
    
    const state = useGameStore.getState()
    
    if (!gameInitialized.current && gameState === 'playing') {
      gameInitialized.current = true
      state.reset()
      
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
    
    const spawnEnemy = (currentTime: number) => {
      const state = useGameStore.getState()
      const enemies = state.entities.filter(e => e.type === 'enemy')
      
      const spawnDelay = Math.max(500, 2000 - state.wave * 100)
      if (currentTime - enemySpawnTime.current > spawnDelay && enemies.length < 20 + state.wave * 2) {
        enemySpawnTime.current = currentTime
        
        const angle = Math.random() * Math.PI * 2
        const distance = 400 + Math.random() * 200
        
        const types = ['basic', 'fast', 'tank', 'swarm']
        const enemyType = types[Math.floor(Math.random() * Math.min(types.length, 1 + Math.floor(state.wave / 3)))]
        
        let enemyStats = {
          hp: 10,
          speed: 1,
          damage: 10,
          radius: 12,
          color: '#FF006E'
        }
        
        switch(enemyType) {
          case 'fast':
            enemyStats = { hp: 5, speed: 2.5, damage: 5, radius: 8, color: '#FB5607' }
            break
          case 'tank':
            enemyStats = { hp: 30, speed: 0.5, damage: 20, radius: 20, color: '#8338EC' }
            break
          case 'swarm':
            enemyStats = { hp: 3, speed: 1.5, damage: 5, radius: 6, color: '#FFBE0B' }
            for (let i = 0; i < 3; i++) {
              const swarmAngle = angle + (Math.random() - 0.5)
              state.addEntity({
                id: `enemy-${Date.now()}-${i}`,
                x: canvas.width / 2 + Math.cos(swarmAngle) * distance,
                y: canvas.height / 2 + Math.sin(swarmAngle) * distance,
                vx: 0,
                vy: 0,
                radius: enemyStats.radius,
                color: enemyStats.color,
                type: 'enemy',
                subtype: enemyType,
                hp: enemyStats.hp,
                maxHp: enemyStats.hp,
                damage: enemyStats.damage,
                speed: enemyStats.speed
              })
            }
            return
        }
        
        const enemy: Entity = {
          id: `enemy-${Date.now()}`,
          x: canvas.width / 2 + Math.cos(angle) * distance,
          y: canvas.height / 2 + Math.sin(angle) * distance,
          vx: 0,
          vy: 0,
          radius: enemyStats.radius,
          color: enemyStats.color,
          type: 'enemy',
          subtype: enemyType,
          hp: enemyStats.hp,
          maxHp: enemyStats.hp,
          damage: enemyStats.damage,
          speed: enemyStats.speed
        }
        
        state.addEntity(enemy)
      }
    }
    
    const shootProjectile = (currentTime: number, player: Entity) => {
      const state = useGameStore.getState()
      const shootDelay = 1000 / state.playerStats.fireRate
      
      if (currentTime - lastShootTime.current > shootDelay) {
        lastShootTime.current = currentTime
        
        const nearestEnemy = state.entities
          .filter(e => e.type === 'enemy')
          .reduce((nearest: Entity | null, enemy) => {
            if (!nearest) return enemy
            const distToNearest = Math.hypot(player.x - nearest.x, player.y - nearest.y)
            const distToEnemy = Math.hypot(player.x - enemy.x, player.y - enemy.y)
            return distToEnemy < distToNearest ? enemy : nearest
          }, null)
        
        if (nearestEnemy) {
          const angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x)
          
          const multishot = state.powerUps.find(p => p.id === 'multishot')?.level || 0
          const projectileCount = 1 + multishot
          
          for (let i = 0; i < projectileCount; i++) {
            const spreadAngle = angle + (i - (projectileCount - 1) / 2) * 0.1
            
            const projectile: Entity = {
              id: `proj-${Date.now()}-${i}`,
              x: player.x,
              y: player.y,
              vx: Math.cos(spreadAngle) * state.playerStats.projectileSpeed,
              vy: Math.sin(spreadAngle) * state.playerStats.projectileSpeed,
              radius: 4,
              color: '#00F5FF',
              type: 'projectile',
              damage: state.playerStats.damage,
              lifetime: 60
            }
            
            state.addEntity(projectile)
          }
          
          soundManager.playTone(800, 0.05, 0.1)
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
      
      ctx.fillStyle = 'rgba(10, 10, 10, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const entities = [...state.entities]
      const player = entities.find(e => e.type === 'player')
      
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
        
        shootProjectile(currentTime, player)
      }
      
      spawnEnemy(currentTime)
      
      entities.forEach(entity => {
        if (entity.type === 'enemy' && player) {
          const dx = player.x - entity.x
          const dy = player.y - entity.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > 0) {
            entity.vx = (dx / distance) * (entity.speed || 1)
            entity.vy = (dy / distance) * (entity.speed || 1)
          }
          
          entity.x += entity.vx
          entity.y += entity.vy
        }
        
        if (entity.type === 'projectile') {
          entity.x += entity.vx
          entity.y += entity.vy
          entity.lifetime = (entity.lifetime || 0) - 1
          
          if (entity.lifetime <= 0 || 
              entity.x < 0 || entity.x > canvas.width || 
              entity.y < 0 || entity.y > canvas.height) {
            state.removeEntity(entity.id)
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
      
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const e1 = entities[i]
          const e2 = entities[j]
          const dist = Math.hypot(e1.x - e2.x, e1.y - e2.y)
          
          if (dist < e1.radius + e2.radius) {
            if (e1.type === 'player' && e2.type === 'enemy') {
              if (!e1.damage) {
                e1.hp = (e1.hp || 0) - (e2.damage || 10)
                e1.damage = 30
                state.triggerScreenShake(10)
                soundManager.playTone(200, 0.1, 0.3)
                
                if (e1.hp <= 0) {
                  soundManager.playGameOver()
                  state.setGameState('gameOver')
                }
              }
            }
            
            if ((e1.type === 'projectile' && e2.type === 'enemy') || (e1.type === 'enemy' && e2.type === 'projectile')) {
              const projectile = e1.type === 'projectile' ? e1 : e2
              const enemy = e1.type === 'enemy' ? e1 : e2
              
              enemy.hp = (enemy.hp || 0) - (projectile.damage || 10)
              
              const explosion = createExplosionParticles(projectile.x, projectile.y, projectile.color, 10)
              state.addParticles(explosion)
              
              state.removeEntity(projectile.id)
              
              if (enemy.hp <= 0) {
                const bigExplosion = createExplosionParticles(enemy.x, enemy.y, enemy.color, 20)
                state.addParticles(bigExplosion)
                
                state.setScore(state.score + 10)
                state.incrementCombo()
                soundManager.playPop()
                state.triggerScreenShake(5)
                
                const xp: Entity = {
                  id: `xp-${Date.now()}`,
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 2,
                  vy: (Math.random() - 0.5) * 2,
                  radius: 6,
                  color: '#06FFB4',
                  type: 'xp'
                }
                state.addEntity(xp)
                
                state.removeEntity(enemy.id)
                
                const enemies = state.entities.filter(e => e.type === 'enemy').length - 1
                if (enemies === 0) {
                  setTimeout(() => {
                    const newState = useGameStore.getState()
                    newState.wave = state.wave + 1
                    newState.triggerScreenShake(20)
                    soundManager.playMerge(newState.wave)
                  }, 100)
                }
              }
            }
            
            if (e1.type === 'player' && e2.type === 'xp') {
              const particles = createAbsorbParticles(e2.x, e2.y, e1.x, e1.y, e2.color, 5)
              state.addParticles(particles)
              state.addXp(10)
              soundManager.playTone(1000, 0.05, 0.2)
              state.removeEntity(e2.id)
            }
          }
        }
      }
      
      if (player && player.damage) {
        player.damage--
      }
      
      entities.forEach(entity => {
        state.updateEntity(entity.id, entity)
      })
      
      state.updateParticles()
      state.updateScreenShake()
      
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
      
      entities.forEach(entity => {
        ctx.save()
        
        if (entity.type === 'player' && entity.damage && entity.damage > 0 && Math.floor(entity.damage / 5) % 2 === 0) {
          ctx.globalAlpha = 0.3
        }
        
        ctx.shadowColor = entity.color
        ctx.shadowBlur = entity.type === 'xp' ? 30 : 20
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
        
        if (entity.type === 'enemy') {
          const hpPercent = (entity.hp || 0) / (entity.maxHp || 1)
          ctx.fillStyle = 'rgba(255, 0, 110, 0.5)'
          ctx.fillRect(entity.x - entity.radius, entity.y - entity.radius - 10, entity.radius * 2, 4)
          ctx.fillStyle = '#FFBE0B'
          ctx.fillRect(entity.x - entity.radius, entity.y - entity.radius - 10, entity.radius * 2 * hpPercent, 4)
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