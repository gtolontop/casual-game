import { Entity, Particle } from '../store/gameStore'

export class OptimizedRenderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private particleCanvas: OffscreenCanvas
  private particleCtx: OffscreenCanvasRenderingContext2D
  private entityCanvas: OffscreenCanvas
  private entityCtx: OffscreenCanvasRenderingContext2D
  
  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx
    this.width = width
    this.height = height
    
    // Create offscreen canvases for layered rendering
    this.particleCanvas = new OffscreenCanvas(width, height)
    this.particleCtx = this.particleCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true
    })!
    
    this.entityCanvas = new OffscreenCanvas(width, height)
    this.entityCtx = this.entityCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true
    })!
  }
  
  resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.particleCanvas.width = width
    this.particleCanvas.height = height
    this.entityCanvas.width = width
    this.entityCanvas.height = height
  }
  
  clear() {
    // Use fillRect instead of clearRect for better performance
    this.ctx.fillStyle = 'rgba(10, 10, 10, 0.3)'
    this.ctx.fillRect(0, 0, this.width, this.height)
  }
  
  renderParticlesBatch(particles: Particle[]) {
    this.particleCtx.clearRect(0, 0, this.width, this.height)
    
    // Group particles by color for batch rendering
    const particlesByColor = new Map<string, Particle[]>()
    
    particles.forEach(p => {
      if (!particlesByColor.has(p.color)) {
        particlesByColor.set(p.color, [])
      }
      particlesByColor.get(p.color)!.push(p)
    })
    
    // Batch render by color
    particlesByColor.forEach((particles, color) => {
      this.particleCtx.fillStyle = color
      this.particleCtx.beginPath()
      
      particles.forEach(p => {
        this.particleCtx.globalAlpha = p.life
        this.particleCtx.moveTo(p.x + p.size, p.y)
        this.particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      })
      
      this.particleCtx.fill()
    })
    
    // Draw particle layer
    this.ctx.drawImage(this.particleCanvas, 0, 0)
  }
  
  renderEntitiesBatch(entities: Entity[]) {
    this.entityCtx.clearRect(0, 0, this.width, this.height)
    
    // Sort entities by type for batch rendering
    const entitiesByType = new Map<string, Entity[]>()
    
    entities.forEach(e => {
      const key = `${e.type}-${e.color}`
      if (!entitiesByType.has(key)) {
        entitiesByType.set(key, [])
      }
      entitiesByType.get(key)!.push(e)
    })
    
    // Render each batch
    entitiesByType.forEach((entities, key) => {
      const [type, color] = key.split('-')
      
      this.entityCtx.fillStyle = color
      this.entityCtx.strokeStyle = '#fff'
      this.entityCtx.lineWidth = 2
      
      // Only add shadows for important entities
      if (type === 'boss' || type === 'player') {
        this.entityCtx.shadowColor = color
        this.entityCtx.shadowBlur = type === 'boss' ? 30 : 15
      } else {
        this.entityCtx.shadowBlur = 0
      }
      
      entities.forEach(entity => {
        this.entityCtx.beginPath()
        this.entityCtx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2)
        this.entityCtx.fill()
        
        if (entity.type === 'player') {
          this.entityCtx.globalAlpha = 0.5
          this.entityCtx.stroke()
          this.entityCtx.globalAlpha = 1
        }
      })
    })
    
    // Draw entity layer
    this.ctx.drawImage(this.entityCanvas, 0, 0)
  }
  
  renderHealthBars(entities: Entity[]) {
    // Render health bars separately to avoid state changes
    entities.forEach(entity => {
      if ((entity.type === 'enemy' || entity.type === 'boss' || entity.type === 'player') && entity.hp && entity.maxHp) {
        const hpPercent = entity.hp / entity.maxHp
        
        if (entity.type === 'player') {
          this.ctx.fillStyle = '#FF006E'
          this.ctx.fillRect(entity.x - 20, entity.y - 30, 40, 4)
          this.ctx.fillStyle = '#06FFB4'
          this.ctx.fillRect(entity.x - 20, entity.y - 30, 40 * hpPercent, 4)
        } else {
          this.ctx.fillStyle = 'rgba(255, 0, 110, 0.5)'
          this.ctx.fillRect(entity.x - entity.radius, entity.y - entity.radius - 10, entity.radius * 2, 4)
          this.ctx.fillStyle = '#FFBE0B'
          this.ctx.fillRect(entity.x - entity.radius, entity.y - entity.radius - 10, entity.radius * 2 * hpPercent, 4)
        }
      }
    })
  }
}