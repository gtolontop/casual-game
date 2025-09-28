import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import './UI.css'

const UI: React.FC = () => {
  const { score, wave, xp, xpToNext, playerLevel, entities, powerUps, playerStats, currentWeapon, unlockedWeapons } = useGameStore()
  const player = entities.find(e => e.type === 'player')
  const boss = entities.find(e => e.type === 'boss')
  const activePowerUps = powerUps.filter(p => p.level > 0)
  
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
      
      {activePowerUps.length > 0 && (
        <div className="power-ups-display">
          {activePowerUps.map(powerUp => (
            <div key={powerUp.id} className="power-up-indicator">
              <span className="power-up-icon">{powerUp.icon}</span>
              <span className="power-up-level">{powerUp.level}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="stats-display">
        <div className="stat">DMG: {Math.round(playerStats.damage)}</div>
        <div className="stat">SPD: {playerStats.moveSpeed.toFixed(1)}</div>
        <div className="stat">RATE: {playerStats.fireRate.toFixed(1)}/s</div>
        <div className="stat">CRIT: {(playerStats.critChance * 100).toFixed(0)}%</div>
      </div>
      
      <div className="weapon-display">
        <div className="current-weapon">
          <span className="weapon-icon">{currentWeapon.icon}</span>
          <span className="weapon-name">{currentWeapon.name}</span>
        </div>
      </div>
      
      {boss && (
        <div className="boss-hp-container">
          <div className="boss-name">{boss.subtype?.toUpperCase()}</div>
          <div className="boss-hp-bar">
            <div 
              className="boss-hp-fill" 
              style={{ width: `${(boss.hp! / boss.maxHp!) * 100}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default UI