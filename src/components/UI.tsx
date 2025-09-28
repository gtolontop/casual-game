import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import './UI.css'

const UI: React.FC = () => {
  const { score, combo } = useGameStore()
  
  return (
    <motion.div 
      className="ui"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="score"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.3 }}
        key={score}
      >
        {score}
      </motion.div>
      
      <AnimatePresence>
        {combo > 1 && (
          <motion.div
            className="combo"
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            key={combo}
          >
            COMBO x{combo}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default UI