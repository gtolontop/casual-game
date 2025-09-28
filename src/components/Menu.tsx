import React from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { soundManager } from '../utils/sound'
import './Menu.css'

const Menu: React.FC = () => {
  const { setGameState, reset, highScore } = useGameStore()
  
  const handleStart = () => {
    soundManager.playClick()
    reset()
    setGameState('playing')
  }
  
  return (
    <motion.div 
      className="menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h1 
        className="menu-title"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
      >
        BUBBLE MERGE
      </motion.h1>
      
      <motion.div
        className="menu-subtitle"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
      >
        Absorb smaller bubbles • Avoid larger ones
      </motion.div>
      
      {highScore > 0 && (
        <motion.div
          className="high-score"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Best Score: {highScore}
        </motion.div>
      )}
      
      <motion.button
        className="play-button"
        onClick={handleStart}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => soundManager.playHover()}
      >
        PLAY
      </motion.button>
      
      <motion.div
        className="controls-info"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Move your mouse to control the bubble
      </motion.div>
    </motion.div>
  )
}

export default Menu