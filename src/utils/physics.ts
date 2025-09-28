import { Bubble } from '../store/gameStore'

export const checkCollision = (b1: Bubble, b2: Bubble): boolean => {
  const dx = b1.x - b2.x
  const dy = b1.y - b2.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance < b1.radius + b2.radius
}

export const resolveCollision = (b1: Bubble, b2: Bubble): void => {
  const dx = b2.x - b1.x
  const dy = b2.y - b1.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  if (distance === 0) return
  
  const unitX = dx / distance
  const unitY = dy / distance
  
  const v1n = unitX * b1.vx + unitY * b1.vy
  const v1t = -unitY * b1.vx + unitX * b1.vy
  const v2n = unitX * b2.vx + unitY * b2.vy
  const v2t = -unitY * b2.vx + unitX * b2.vy
  
  const m1 = b1.radius
  const m2 = b2.radius
  
  const v1nNew = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2)
  const v2nNew = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2)
  
  b1.vx = unitX * v1nNew - unitY * v1t
  b1.vy = unitY * v1nNew + unitX * v1t
  b2.vx = unitX * v2nNew - unitY * v2t
  b2.vy = unitY * v2nNew + unitX * v2t
  
  const overlap = b1.radius + b2.radius - distance
  const separationX = unitX * overlap / 2
  const separationY = unitY * overlap / 2
  
  b1.x -= separationX
  b1.y -= separationY
  b2.x += separationX
  b2.y += separationY
}

export const applyFriction = (bubble: Bubble, friction: number = 0.99): void => {
  bubble.vx *= friction
  bubble.vy *= friction
}

export const constrainToCanvas = (bubble: Bubble, width: number, height: number): void => {
  if (bubble.x - bubble.radius < 0) {
    bubble.x = bubble.radius
    bubble.vx = Math.abs(bubble.vx) * 0.8
  }
  if (bubble.x + bubble.radius > width) {
    bubble.x = width - bubble.radius
    bubble.vx = -Math.abs(bubble.vx) * 0.8
  }
  if (bubble.y - bubble.radius < 0) {
    bubble.y = bubble.radius
    bubble.vy = Math.abs(bubble.vy) * 0.8
  }
  if (bubble.y + bubble.radius > height) {
    bubble.y = height - bubble.radius
    bubble.vy = -Math.abs(bubble.vy) * 0.8
  }
}