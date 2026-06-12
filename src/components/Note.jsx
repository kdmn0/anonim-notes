import React, { useMemo, useState, useRef } from 'react';
import './Note.css';

let globalZIndex = 1;

function Note({ message, onMoveEnd }) {
  // Generate a random slight rotation for realism (-5deg to 5deg)
  const rotation = useMemo(() => {
    return Math.floor(Math.random() * 10) - 5;
  }, []);

  const [position, setPosition] = useState({ x: message.position_x, y: message.position_y });
  const [isDragging, setIsDragging] = useState(false);
  const [localZIndex, setLocalZIndex] = useState(1);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handlePointerDown = (e) => {
    // Sadece sol tıklamada çalışsın
    if (e.button !== undefined && e.button !== 0) return;
    
    globalZIndex += 1;
    setLocalZIndex(globalZIndex);

    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId); // Fareyi hızlı hareket ettirince objeden çıkmasını önler
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    // Yüzdelik olarak ne kadar hareket ettiğini hesapla (ekran boyutuna göre)
    const percentX = (dx / window.innerWidth) * 100;
    const percentY = (dy / window.innerHeight) * 100;

    let newX = Math.round(dragRef.current.initialX + percentX);
    let newY = Math.round(dragRef.current.initialY + percentY);

    // Ekran dışına çıkmasını engelle
    newX = Math.max(0, Math.min(newX, 90));
    newY = Math.max(0, Math.min(newY, 90));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);

    // Dışarıya kaydetmesi için haber ver (sadece pozisyon değiştiyse)
    if (position.x !== dragRef.current.initialX || position.y !== dragRef.current.initialY) {
      if (onMoveEnd) {
        onMoveEnd(message.id, position.x, position.y);
      }
    }
  };

  // Eğer dışarıdan (realtime) pozisyon değişirse senkronize ol
  React.useEffect(() => {
    if (!isDragging) {
      setPosition({ x: message.position_x, y: message.position_y });
    }
  }, [message.position_x, message.position_y, isDragging]);

  // Parse color and shape from message.color
  const colorData = message.color || '#feff9c';
  const [actualColor, actualShape = 'square'] = colorData.split('|');

  const style = {
    top: `${position.y}%`,
    left: `${position.x}%`,
    '--note-color': actualColor,
    transform: `rotate(${rotation}deg)`,
    zIndex: isDragging ? 10000 : localZIndex,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const shapeClass = `note-shape-${actualShape}`;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className={`note-container ${shapeClass}`} 
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="note-pin"></div>
      <div className="note-content">
        {message.content}
      </div>
      {message.created_at && (
        <div className="note-footer">
          {formatDate(message.created_at)}
        </div>
      )}
    </div>
  );
}

export default Note;
