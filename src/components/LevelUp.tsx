import React from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { soundManager } from '../utils/sound'
import './LevelUp.css'

const LevelUp: React.FC = () => {
  const { availableUpgrades, selectUpgrade, playerLevel } = useGameStore()
  
  const handleSelectUpgrade = (upgradeId: string) => {
    soundManager.playClick()
    selectUpgrade(upgradeId)
  }
  
  return (
    <motion.div 
      className="level-up-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="level-up-container"
        initial={{ scale: 0.5, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <motion.h2
          className="level-up-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          LEVEL {playerLevel}!
        </motion.h2>
        
        <div className="upgrades-container">
          {availableUpgrades.map((upgrade, index) => (
            <motion.div
              key={upgrade.id}
              className="upgrade-card"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelectUpgrade(upgrade.id)}
              onHoverStart={() => soundManager.playHover()}
            >
              <div className="upgrade-icon">{upgrade.icon}</div>
              <div className="upgrade-name">{upgrade.name}</div>
              <div className="upgrade-level">Lv. {upgrade.level + 1}</div>
              <div className="upgrade-description">{upgrade.description}</div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          className="level-up-tip"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Choose an upgrade to continue
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default LevelUp