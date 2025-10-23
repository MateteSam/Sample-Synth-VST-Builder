/**
 * Confetti Success Animation
 * Shows a burst of celebratory confetti on successful export
 */

import React, { useEffect, useState } from 'react';

/**
 * Confetti Component - Renders celebratory particle effect
 * @param {boolean} isVisible - Controls when confetti appears
 * @param {number} duration - How long to show confetti (ms)
 */
export const Confetti = ({ isVisible, duration = 1500 }) => {
  const [particles, setParticles] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    setIsAnimating(true);

    // Generate random confetti particles
    const newParticles = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.2,
      duration: 1.5 + Math.random() * 0.5,
      size: 4 + Math.random() * 12,
      rotation: Math.random() * 360,
      color: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][
        Math.floor(Math.random() * 5)
      ],
      opacity: 0.8 + Math.random() * 0.2
    }));

    setParticles(newParticles);

    // Clear particles after animation completes
    const timer = setTimeout(() => {
      setParticles([]);
      setIsAnimating(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration]);

  if (particles.length === 0) return null;

  return (
    <div className="confetti-container">
      {particles.map((particle) => (
        <ConfettiParticle key={particle.id} particle={particle} />
      ))}

      <style jsx>{`
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

/**
 * Individual Confetti Particle
 */
const ConfettiParticle = ({ particle }) => {
  return (
    <div
      className="confetti-particle"
      style={{
        '--delay': `${particle.delay}s`,
        '--duration': `${particle.duration}s`,
        '--left': `${particle.left}%`,
        '--size': `${particle.size}px`,
        '--color': particle.color,
        '--rotation': `${particle.rotation}deg`,
        '--opacity': particle.opacity
      }}
    />
  );
};

// Ensure we also export the component
export default Confetti;

// Add styles at module level for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes confetti-fall {
    to {
      transform: translateY(100vh) rotateZ(360deg);
      opacity: 0;
    }
  }

  @keyframes confetti-drift {
    0%, 100% {
      transform: translateX(0) rotateZ(var(--rotation));
    }
    25% {
      transform: translateX(30px) rotateZ(var(--rotation));
    }
    50% {
      transform: translateX(0) rotateZ(calc(var(--rotation) + 180deg));
    }
    75% {
      transform: translateX(-30px) rotateZ(var(--rotation));
    }
  }

  .confetti-particle {
    position: fixed;
    width: var(--size);
    height: var(--size);
    background-color: var(--color);
    border-radius: 50%;
    left: var(--left);
    top: -10px;
    pointer-events: none;
    animation: 
      confetti-fall var(--duration) ease-in forwards,
      confetti-drift calc(var(--duration) / 2) ease-in-out infinite;
    animation-delay: var(--delay);
    opacity: var(--opacity);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }
`;
document.head.appendChild(style);
