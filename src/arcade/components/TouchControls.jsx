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
  const hasDpad = controls.includes('left') || controls.includes('right');
  const hasThrust = controls.includes('thrust');
  const hasDown = controls.includes('down');
  const hasRotate = controls.includes('rotate');
  const hasFire = controls.includes('fire');
  const hasDrop = controls.includes('drop');

  return (
    <div className="touch-controls">
      <div className="touch-dpad">
        {/* Row 1: up/thrust in center */}
        <div className="touch-btn--spacer" />
        {(hasThrust || hasRotate) ? (
          <TouchButton
            label={hasThrust ? '\u25B2' : '\u21BB'}
            action={hasThrust ? 'thrust' : 'rotate'}
            onAction={onAction}
          />
        ) : <div className="touch-btn--spacer" />}
        <div className="touch-btn--spacer" />

        {/* Row 2: left, down, right */}
        {hasDpad && (
          <>
            <TouchButton label={'\u25C0'} action="left" onAction={onAction} />
            {hasDown ? (
              <TouchButton label={'\u25BC'} action="down" onAction={onAction} />
            ) : <div className="touch-btn--spacer" />}
            <TouchButton label={'\u25B6'} action="right" onAction={onAction} />
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
