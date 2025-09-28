import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import './UI.css'

const UI: React.FC = () => {
  const { score, wave, xp, xpToNext, playerLevel, entities } = useGameStore()
  const player = entities.find(e => e.type === 'player')
  
  return (
    <motion.div 
      className="ui"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="ui-top">
        <motion.div 
          className="score"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.3 }}
          key={score}
        >
          {score}
        </motion.div>
        
        <div className="wave-indicator">
          Wave {wave}
        </div>
      </div>
      
      <div className="ui-bottom">
        <div className="level-info">
          <div className="level">LV {playerLevel}</div>
          <div className="xp-bar">
            <div 
              className="xp-fill" 
              style={{ width: `${(xp / xpToNext) * 100}%` }}
            />
            <div className="xp-text">{xp}/{xpToNext}</div>
          </div>
        </div>
        
        {player && (
          <div className="hp-info">
            <div className="hp-bar">
              <div 
                className="hp-fill" 
                style={{ width: `${(player.hp! / player.maxHp!) * 100}%` }}
              />
              <div className="hp-text">{Math.ceil(player.hp!)}/{player.maxHp}</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default UI