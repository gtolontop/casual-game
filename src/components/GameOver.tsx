import React from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { soundManager } from '../utils/sound'
import './GameOver.css'

const GameOver: React.FC = () => {
  const { score, highScore, setGameState, reset } = useGameStore()
  const isNewHighScore = score === highScore && score > 0
  
  const handleRestart = () => {
    soundManager.playClick()
    reset()
    setGameState('playing')
  }
  
  const handleMenu = () => {
    soundManager.playClick()
    reset()
    setGameState('menu')
  }
  
  return (
    <motion.div 
      className="game-over"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h2
        className="game-over-title"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
      >
        GAME OVER
      </motion.h2>
      
      <motion.div
        className="final-score"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Score: {score}
      </motion.div>
      
      {isNewHighScore && (
        <motion.div
          className="new-record"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
        >
          NEW RECORD!
        </motion.div>
      )}
      
      <motion.div
        className="button-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          className="game-button restart"
          onClick={handleRestart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => soundManager.playHover()}
        >
          PLAY AGAIN
        </motion.button>
        
        <motion.button
          className="game-button menu"
          onClick={handleMenu}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => soundManager.playHover()}
        >
          MENU
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default GameOver