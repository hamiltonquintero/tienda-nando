import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DevCreditBadge({ isCatalog = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsClicked(true);
    setShowGreeting(true);

    try {
      confetti({
        particleCount: 35,
        spread: 65,
        origin: { y: 0.88, x: 0.88 },
        colors: ['#0284c7', '#38bdf8', '#f59e0b', '#ec4899', '#10b981']
      });
    } catch (err) {}

    setTimeout(() => {
      setIsClicked(false);
    }, 2200);

    setTimeout(() => {
      setShowGreeting(false);
    }, 2800);
  };

  // Determinar la pose actual del robot oficial
  const currentRobotPose = isClicked 
    ? '/robot/robot-celebrando.svg' 
    : isHovered 
      ? '/robot/robot-saludando.svg' 
      : '/robot/robot-idle.svg';

  return (
    <div 
      className={`dev-credit-floating-badge ${isCatalog ? 'in-catalog' : 'in-admin'}`}
      title="🤖 ¡Mascota Robot de Hamilton Q.! Haz clic para celebrar"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speech bubble del Robot Oficial */}
      {showGreeting && (
        <div className="cat-meow-bubble robot-bubble">
          <span>🚀 ¡Creado con pasión por Hamilton Q.! ✨</span>
        </div>
      )}

      <div className={`dev-credit-inner dev-credit-robot-theme ${isClicked ? 'clicked-pulse' : ''}`}>
        {/* Robot Oficial Interactivo */}
        <div className="dev-official-robot-wrapper">
          <img 
            src={currentRobotPose} 
            alt="Robot mascota Hamilton Q." 
            className={`dev-official-robot-img ${isClicked ? 'celebrating-jump' : ''}`}
          />
          <span className="robot-antenna-spark">✨</span>
        </div>

        <span className="dev-credit-sparkle">
          <Sparkles size={14} className="sparkle-icon" />
        </span>
        <span className="dev-credit-label">Desarrollado por</span>
        <strong className="dev-credit-name">Hamilton Q.</strong>
      </div>
    </div>
  );
}

