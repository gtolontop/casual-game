import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { soundManager } from '../utils/sound'
import Canvas from './Canvas'
import Menu from './Menu'
import UI from './UI'
import GameOver from './GameOver'
import LevelUp from './LevelUp'
import './Game.css'

const Game: React.FC = () => {
  const gameState = useGameStore(state => state.gameState)
  const screenShake = useGameStore(state => state.screenShake)
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    const init = async () => {
      await soundManager.init()
      setIsInitialized(true)
    }
    
    const handleUserInteraction = () => {
      if (!isInitialized) {
        init()
      }
    }
    
    window.addEventListener('click', handleUserInteraction, { once: true })
    window.addEventListener('touchstart', handleUserInteraction, { once: true })
    
    return () => {
      window.removeEventListener('click', handleUserInteraction)
      window.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [isInitialized])
  
  return (
    <div className="game-container">
      <motion.div
        className="game-wrapper"
        animate={{
          x: screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0,
          y: screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0,
        }}
        transition={{ duration: 0.1 }}
      >
        <Canvas />
        
        <AnimatePresence mode="wait">
          {gameState === 'menu' && <Menu key="menu" />}
          {gameState === 'playing' && <UI key="ui" />}
          {gameState === 'gameOver' && <GameOver key="gameover" />}
          {gameState === 'levelUp' && <LevelUp key="levelup" />}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default Game