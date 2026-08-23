import { useRef, useCallback } from 'react';

function TouchButton({ label, action, onAction, className = 'touch-btn' }) {
  const activeRef = useRef(false);

  const handleStart = useCallback((e) => {
    e.preventDefault();
    if (!activeRef.current) {
      activeRef.current = true;
      onAction(action, true);
    }
  }, [action, onAction]);

  const handleEnd = useCallback((e) => {
    e.preventDefault();
    if (activeRef.current) {
      activeRef.current = false;
      onAction(action, false);
    }
  }, [action, onAction]);

  return (
    <button
      className={className}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      aria-label={action}
    >
      {label}
    </button>
  );
}

function TouchControls({ controls, onAction }) {
  const hasLeft = controls.includes('left');
  const hasRight = controls.includes('right');
  const hasUp = controls.includes('up');
  const hasDown = controls.includes('down');
  const hasThrust = controls.includes('thrust');
  const hasRotate = controls.includes('rotate');
  const hasFire = controls.includes('fire');
  const hasDrop = controls.includes('drop');
  const hasDpad = hasLeft || hasRight || hasUp || hasDown;

  // Top-center d-pad button: thrust > up > rotate
  let topAction = null;
  let topLabel = null;
  if (hasThrust) { topAction = 'thrust'; topLabel = '\u25B2'; }
  else if (hasUp) { topAction = 'up'; topLabel = '\u25B2'; }
  else if (hasRotate) { topAction = 'rotate'; topLabel = '\u21BB'; }

  return (
    <div className="touch-controls">
      <div className="touch-dpad">
        {/* Row 1: up/thrust/rotate in center */}
        <div className="touch-btn--spacer" />
        {topAction ? (
          <TouchButton label={topLabel} action={topAction} onAction={onAction} />
        ) : <div className="touch-btn--spacer" />}
        <div className="touch-btn--spacer" />

        {/* Row 2: left, down, right */}
        {hasDpad && (
          <>
            {hasLeft ? (
              <TouchButton label={'\u25C0'} action="left" onAction={onAction} />
            ) : <div className="touch-btn--spacer" />}
            {hasDown ? (
              <TouchButton label={'\u25BC'} action="down" onAction={onAction} />
            ) : <div className="touch-btn--spacer" />}
            {hasRight ? (
              <TouchButton label={'\u25B6'} action="right" onAction={onAction} />
            ) : <div className="touch-btn--spacer" />}
          </>
        )}
      </div>

      <div className="touch-action-buttons">
        {hasFire && (
          <TouchButton
            label="FIRE"
            action="fire"
            onAction={onAction}
            className="touch-action-btn"
          />
        )}
        {hasDrop && (
          <TouchButton
            label="DROP"
            action="drop"
            onAction={onAction}
            className="touch-action-btn"
          />
        )}
        {hasRotate && hasDpad && (
          <TouchButton
            label={'\u21BB'}
            action="rotate"
            onAction={onAction}
            className="touch-action-btn"
          />
        )}
      </div>
    </div>
  );
}

export default TouchControls;
