import React, { useRef, useEffect } from 'react'
import { useGameStore, Bubble } from '../store/gameStore'
import { checkCollision, resolveCollision, applyFriction, constrainToCanvas } from '../utils/physics'
import { getColorForLevel } from '../utils/colors'
import { createExplosionParticles, createAbsorbParticles, createTrailParticles } from '../utils/particles'
import { soundManager } from '../utils/sound'
import './Canvas.css'

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })
  
  const {
    bubbles,
    particles,
    gameState,
    score,
    addBubble,
    removeBubble,
    updateBubble,
    setScore,
    setGameState,
    incrementCombo,
    resetCombo,
    addParticles,
    updateParticles,
    triggerScreenShake,
    updateScreenShake
  } = useGameStore()
  
  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const player: Bubble = {
      id: 'player',
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 0,
      vy: 0,
      radius: 30,
      color: getColorForLevel(0),
      level: 0,
      isPlayer: true
    }
    
    addBubble(player)
    
    for (let i = 0; i < 20; i++) {
      const level = Math.floor(Math.random() * 3)
      const bubble: Bubble = {
        id: `bubble-${Date.now()}-${i}`,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 15 + level * 5,
        color: getColorForLevel(level),
        level
      }
      addBubble(bubble)
    }
    
    const spawnBubble = () => {
      if (bubbles.length < 30 && Math.random() < 0.02) {
        const side = Math.floor(Math.random() * 4)
        let x, y, vx, vy
        
        switch(side) {
          case 0:
            x = -30
            y = Math.random() * canvas.height
            vx = 1 + Math.random() * 2
            vy = (Math.random() - 0.5) * 2
            break
          case 1:
            x = canvas.width + 30
            y = Math.random() * canvas.height
            vx = -1 - Math.random() * 2
            vy = (Math.random() - 0.5) * 2
            break
          case 2:
            x = Math.random() * canvas.width
            y = -30
            vx = (Math.random() - 0.5) * 2
            vy = 1 + Math.random() * 2
            break
          default:
            x = Math.random() * canvas.width
            y = canvas.height + 30
            vx = (Math.random() - 0.5) * 2
            vy = -1 - Math.random() * 2
        }
        
        const level = Math.floor(Math.random() * Math.min(4, Math.floor(score / 100) + 1))
        const bubble: Bubble = {
          id: `bubble-${Date.now()}-${Math.random()}`,
          x, y, vx, vy,
          radius: 15 + level * 5,
          color: getColorForLevel(level),
          level
        }
        addBubble(bubble)
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
      if (!ctx || gameState !== 'playing') return
      
      ctx.fillStyle = 'rgba(10, 10, 10, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const currentBubbles = [...bubbles]
      const player = currentBubbles.find(b => b.isPlayer)
      
      if (player) {
        const dx = mouseRef.current.x - player.x
        const dy = mouseRef.current.y - player.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > 5) {
          const speed = Math.min(distance / 10, 8)
          player.vx += (dx / distance) * speed * 0.2
          player.vy += (dy / distance) * speed * 0.2
        }
        
        if (Math.abs(player.vx) > 1 || Math.abs(player.vy) > 1) {
          const trail = createTrailParticles(player.x, player.y, player.vx, player.vy, player.color)
          if (trail.length > 0) addParticles(trail)
        }
      }
      
      spawnBubble()
      
      currentBubbles.forEach(bubble => {
        bubble.x += bubble.vx
        bubble.y += bubble.vy
        
        applyFriction(bubble, bubble.isPlayer ? 0.92 : 0.995)
        constrainToCanvas(bubble, canvas.width, canvas.height)
        
        if (!bubble.isPlayer && 
            (bubble.x < -50 || bubble.x > canvas.width + 50 || 
             bubble.y < -50 || bubble.y > canvas.height + 50)) {
          removeBubble(bubble.id)
        }
      })
      
      for (let i = 0; i < currentBubbles.length; i++) {
        for (let j = i + 1; j < currentBubbles.length; j++) {
          const b1 = currentBubbles[i]
          const b2 = currentBubbles[j]
          
          if (checkCollision(b1, b2)) {
            if (b1.isPlayer || b2.isPlayer) {
              const player = b1.isPlayer ? b1 : b2
              const other = b1.isPlayer ? b2 : b1
              
              if (player.radius > other.radius * 1.2) {
                const particles = createAbsorbParticles(other.x, other.y, player.x, player.y, other.color)
                addParticles(particles)
                
                player.radius += other.radius * 0.2
                setScore(score + (other.level + 1) * 10)
                incrementCombo()
                
                soundManager.playPop(other.radius / 20)
                triggerScreenShake(5)
                
                removeBubble(other.id)
                
                if (player.radius > 40 && player.level < 9) {
                  player.level++
                  player.color = getColorForLevel(player.level)
                  player.radius = 30 + player.level * 5
                  
                  const explosion = createExplosionParticles(player.x, player.y, player.color, 30)
                  addParticles(explosion)
                  soundManager.playMerge(player.level)
                  triggerScreenShake(10)
                }
              } else if (other.radius > player.radius * 1.5) {
                soundManager.playGameOver()
                setGameState('gameOver')
                return
              } else {
                resolveCollision(b1, b2)
                soundManager.playTone(400, 0.05, 0.1)
              }
            } else {
              if (b1.level === b2.level && b1.radius === b2.radius) {
                const newX = (b1.x + b2.x) / 2
                const newY = (b1.y + b2.y) / 2
                
                const particles = createExplosionParticles(newX, newY, b1.color, 15)
                addParticles(particles)
                
                removeBubble(b1.id)
                removeBubble(b2.id)
                
                if (b1.level < 8) {
                  const merged: Bubble = {
                    id: `merged-${Date.now()}`,
                    x: newX,
                    y: newY,
                    vx: (b1.vx + b2.vx) / 2,
                    vy: (b1.vy + b2.vy) / 2,
                    radius: b1.radius + 5,
                    level: b1.level + 1,
                    color: getColorForLevel(b1.level + 1)
                  }
                  addBubble(merged)
                  soundManager.playMerge(merged.level)
                }
              } else {
                resolveCollision(b1, b2)
              }
            }
          }
        }
      }
      
      updateParticles()
      updateScreenShake()
      
      particles.forEach(particle => {
        ctx.save()
        ctx.globalAlpha = particle.life
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
      
      currentBubbles.forEach(bubble => {
        updateBubble(bubble.id, bubble)
        
        ctx.save()
        ctx.shadowColor = bubble.color
        ctx.shadowBlur = 20
        
        const gradient = ctx.createRadialGradient(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          0,
          bubble.x,
          bubble.y,
          bubble.radius
        )
        gradient.addColorStop(0, bubble.color)
        gradient.addColorStop(0.7, bubble.color + 'aa')
        gradient.addColorStop(1, bubble.color + '44')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)
        ctx.fill()
        
        if (bubble.isPlayer) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.5
          ctx.stroke()
        }
        
        ctx.restore()
      })
      
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    
    animationRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
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