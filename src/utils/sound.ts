class SoundManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private initialized = false
  
  async init() {
    if (this.initialized) return
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }
  
  async playTone(frequency: number, duration: number = 0.1, volume: number = 0.3) {
    if (!this.audioContext) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)
    
    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration)
  }
  
  playPop(size: number = 1) {
    const baseFreq = 800 - (size * 50)
    this.playTone(baseFreq, 0.1, 0.2)
    setTimeout(() => this.playTone(baseFreq * 1.5, 0.05, 0.1), 50)
  }
  
  playMerge(level: number = 1) {
    const baseFreq = 400 + (level * 100)
    this.playTone(baseFreq, 0.15, 0.3)
    setTimeout(() => this.playTone(baseFreq * 1.25, 0.1, 0.2), 50)
    setTimeout(() => this.playTone(baseFreq * 1.5, 0.1, 0.15), 100)
  }
  
  playCombo(combo: number) {
    const freq = 600 + (combo * 50)
    this.playTone(freq, 0.2, 0.3)
  }
  
  playGameOver() {
    this.playTone(300, 0.3, 0.4)
    setTimeout(() => this.playTone(250, 0.3, 0.3), 150)
    setTimeout(() => this.playTone(200, 0.5, 0.2), 300)
  }
  
  playHover() {
    this.playTone(1000, 0.05, 0.1)
  }
  
  playClick() {
    this.playTone(600, 0.05, 0.2)
    setTimeout(() => this.playTone(800, 0.05, 0.15), 30)
  }
}

export const soundManager = new SoundManager()