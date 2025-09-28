import React from 'react'
import { motion } from 'framer-motion'
import './BossWarning.css'

const BossWarning: React.FC = () => {
  return (
    <motion.div 
      className="boss-warning-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="boss-warning-text"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ 
          repeat: Infinity, 
          duration: 1,
          ease: "easeInOut"
        }}
      >
        WARNING
      </motion.div>
      
      <motion.div
        className="boss-subtitle"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        BOSS INCOMING
      </motion.div>
    </motion.div>
  )
}

export default BossWarning