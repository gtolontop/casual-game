import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import './UI.css'

const UI: React.FC = () => {
  const { 
    score, wave, xp, xpToNext, playerLevel, entities, powerUps, playerStats, 
    currentWeapon, unlockedWeapons, killStreak, dashReady 
  } = useGameStore()
  
  const player = entities.find(e => e.type === 'player')
  const boss = entities.find(e => e.type === 'boss')
  const activePowerUps = powerUps.filter(p => p.level > 0)
  
  const hpPercent = player ? (player.hp! / player.maxHp!) : 0
  const xpPercent = xp / xpToNext
  const ragePercent = Math.min(playerStats.rageBar / 100, 1)
  
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
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          key={score}
        >
          {score.toLocaleString()}
        </motion.div>
        
        <div className="wave-indicator">
          Wave {wave}
        </div>
      </div>
      
      <div className="kill-streak">
        <div className="streak-label">Streak</div>
        <motion.div 
          className="streak-count"
          animate={{ scale: killStreak > 0 ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.2 }}
          key={killStreak}
        >
          {killStreak}
        </motion.div>
        {playerStats.comboMultiplier > 1 && (
          <div className="combo-multiplier">x{playerStats.comboMultiplier.toFixed(1)}</div>
        )}
      </div>
      
      <div className="ui-bottom">
        <div className="level-info">
          <div className="level">LV {playerLevel}</div>
          <div className="xp-bar">
            <div 
              className="xp-fill" 
              style={{ width: `${xpPercent * 100}%` }}
            />
            <div className="xp-text">{xp}/{xpToNext}</div>
          </div>
        </div>
        
        {player && (
          <div className="hp-info">
            <div className="hp-bar">
              <div 
                className={`hp-fill ${hpPercent < 0.3 ? 'low' : ''}`}
                style={{ width: `${hpPercent * 100}%` }}
              />
              <div className="hp-text">{Math.ceil(player.hp!)}/{player.maxHp}</div>
            </div>
            <div className="rage-bar">
              <div 
                className={`rage-fill ${ragePercent >= 1 ? 'ready' : ''}`}
                style={{ width: `${ragePercent * 100}%` }}
              />
              <div className="rage-text">RAGE</div>
            </div>
          </div>
        )}
      </div>
      
      {activePowerUps.length > 0 && (
        <div className="power-ups-display">
          {activePowerUps.slice(0, 8).map(powerUp => (
            <motion.div 
              key={powerUp.id} 
              className="power-up-indicator"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <span className="power-up-icon">{powerUp.icon}</span>
              <span className="power-up-level">{powerUp.level}</span>
            </motion.div>
          ))}
        </div>
      )}
      
      <div className="stats-display">
        <div className="stat">DMG: {Math.round(playerStats.damage)}</div>
        <div className="stat">SPD: {playerStats.moveSpeed.toFixed(1)}</div>
        <div className="stat">RATE: {playerStats.fireRate.toFixed(1)}/s</div>
        <div className="stat">CRIT: {(playerStats.critChance * 100).toFixed(0)}%</div>
        <div className="stat">LUCK: {playerStats.luck.toFixed(1)}x</div>
      </div>
      
      <div className="weapon-display">
        <div className="current-weapon">
          <span className="weapon-icon">{currentWeapon.icon}</span>
          <span className="weapon-name">{currentWeapon.name}</span>
        </div>
        <div className={`dash-indicator ${dashReady ? 'dash-ready' : ''}`}>
          <div 
            className="dash-fill" 
            style={{ width: dashReady ? '100%' : '0%' }}
          />
        </div>
      </div>
      
      {boss && (
        <motion.div 
          className="boss-hp-container"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
        >
          <div className="boss-name">{boss.subtype?.toUpperCase().replace('_', ' ')}</div>
          <div className="boss-hp-bar">
            <div 
              className="boss-hp-fill" 
              style={{ width: `${(boss.hp! / boss.maxHp!) * 100}%` }}
            />
            <div className="boss-hp-text">
              {Math.ceil(boss.hp!)} / {boss.maxHp}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default UI