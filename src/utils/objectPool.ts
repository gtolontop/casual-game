// Object pooling for performance
export class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void
  
  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize: number = 50) {
    this.createFn = createFn
    this.resetFn = resetFn
    
    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn())
    }
  }
  
  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }
  
  release(obj: T): void {
    this.resetFn(obj)
    this.pool.push(obj)
  }
  
  releaseAll(objects: T[]): void {
    objects.forEach(obj => this.release(obj))
  }
}

// Spatial grid for collision optimization
export class SpatialGrid<T extends { x: number; y: number; radius: number }> {
  private grid: Map<string, T[]> = new Map()
  private cellSize: number
  
  constructor(cellSize: number = 100) {
    this.cellSize = cellSize
  }
  
  clear() {
    this.grid.clear()
  }
  
  add(entity: T) {
    const cellX = Math.floor(entity.x / this.cellSize)
    const cellY = Math.floor(entity.y / this.cellSize)
    const key = `${cellX},${cellY}`
    
    if (!this.grid.has(key)) {
      this.grid.set(key, [])
    }
    this.grid.get(key)!.push(entity)
  }
  
  getNearby(entity: T): T[] {
    const nearby: T[] = []
    const cellX = Math.floor(entity.x / this.cellSize)
    const cellY = Math.floor(entity.y / this.cellSize)
    
    // Check surrounding cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`
        const cellEntities = this.grid.get(key)
        if (cellEntities) {
          nearby.push(...cellEntities)
        }
      }
    }
    
    return nearby
  }
}

// Canvas buffer for batch rendering
export class CanvasBuffer {
  private buffer: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  
  constructor(width: number, height: number) {
    this.buffer = document.createElement('canvas')
    this.buffer.width = width
    this.buffer.height = height
    this.ctx = this.buffer.getContext('2d', { 
      alpha: false,
      desynchronized: true
    })!
  }
  
  clear() {
    this.ctx.clearRect(0, 0, this.buffer.width, this.buffer.height)
  }
  
  getContext() {
    return this.ctx
  }
  
  drawTo(targetCtx: CanvasRenderingContext2D) {
    targetCtx.drawImage(this.buffer, 0, 0)
  }
}