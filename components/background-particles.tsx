"use client"

import { useEffect, useState } from "react"

// This is a client-only component to avoid hydration mismatches
export default function BackgroundParticles() {
  const [particles, setParticles] = useState<Array<{
    id: number,
    width: number,
    height: number,
    top: number,
    left: number,
    animationDuration: number,
    animationDelay: number
  }>>([])
  
  // Generate random particles only on the client side
  useEffect(() => {
    const generatedParticles = Array(10).fill(null).map((_, i) => ({
      id: i,
      width: 10 + Math.random() * 20,
      height: 10 + Math.random() * 20,
      top: Math.random() * 100,
      left: Math.random() * 100,
      animationDuration: 10 + Math.random() * 20,
      animationDelay: Math.random() * 10
    }))
    
    setParticles(generatedParticles)
  }, [])
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute bg-indigo-200 rounded-full opacity-20"
          style={{
            width: `${particle.width}px`,
            height: `${particle.height}px`,
            top: `${particle.top}%`,
            left: `${particle.left}%`,
            animation: `float ${particle.animationDuration}s linear infinite`,
            animationDelay: `${particle.animationDelay}s`,
          }}
        />
      ))}
    </div>
  )
}
