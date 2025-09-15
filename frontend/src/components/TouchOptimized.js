import React, { useState, useRef, useEffect } from 'react';

/**
 * TouchOptimized Component
 * Provides enhanced touch interactions for mobile devices
 * Optimized for Capacitor mobile apps
 */
const TouchOptimized = ({ 
  children, 
  onTap, 
  onLongPress, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  className = '',
  disabled = false,
  hapticFeedback = true,
  ...props 
}) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef(null);
  const elementRef = useRef(null);

  // Minimum distance for swipe detection
  const minSwipeDistance = 50;

  // Long press duration
  const longPressDelay = 500;

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const triggerHaptic = async (type = 'light') => {
    if (!hapticFeedback || !window.Capacitor) return;
    
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'selection':
          await Haptics.selectionStart();
          break;
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (error) {
      // Haptics not available, silently fail
      console.debug('Haptics not available:', error);
    }
  };

  const handleTouchStart = (e) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setTouchEnd(null);

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      if (onLongPress) {
        triggerHaptic('medium');
        onLongPress(e);
      }
    }, longPressDelay);
  };

  const handleTouchMove = (e) => {
    if (disabled || !touchStart) return;
    
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });

    // Cancel long press if user moves finger
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchEnd = (e) => {
    if (disabled) return;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!touchStart || !touchEnd) {
      // Simple tap
      if (onTap && !isLongPressing) {
        triggerHaptic('light');
        onTap(e);
      }
      setIsLongPressing(false);
      return;
    }

    const distanceX = touchEnd.x - touchStart.x;
    const distanceY = touchEnd.y - touchStart.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const duration = touchEnd.time - touchStart.time;

    // Check if it's a swipe (quick movement)
    if (duration < 300 && distance > minSwipeDistance) {
      const absX = Math.abs(distanceX);
      const absY = Math.abs(distanceY);

      if (absX > absY) {
        // Horizontal swipe
        if (distanceX > 0 && onSwipeRight) {
          triggerHaptic('selection');
          onSwipeRight(e);
        } else if (distanceX < 0 && onSwipeLeft) {
          triggerHaptic('selection');
          onSwipeLeft(e);
        }
      } else {
        // Vertical swipe
        if (distanceY > 0 && onSwipeDown) {
          triggerHaptic('selection');
          onSwipeDown(e);
        } else if (distanceY < 0 && onSwipeUp) {
          triggerHaptic('selection');
          onSwipeUp(e);
        }
      }
    } else if (distance < minSwipeDistance && onTap && !isLongPressing) {
      // Tap
      triggerHaptic('light');
      onTap(e);
    }

    setIsLongPressing(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleMouseDown = (e) => {
    // Handle mouse events for desktop testing
    if (disabled) return;
    
    setTouchStart({
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    });
  };

  const handleMouseUp = (e) => {
    if (disabled || !touchStart) return;
    
    if (onTap) {
      onTap(e);
    }
    setTouchStart(null);
  };

  return (
    <div
      ref={elementRef}
      className={`touch-optimized ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default TouchOptimized;
