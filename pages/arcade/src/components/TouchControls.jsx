import { useRef, useCallback } from 'react';

function TouchButton({ label, action, onAction, className = 'touch-btn' }) {
  const activeRef = useRef(false);

  // Games see one press and one release per touch, however many
  // touchstart/touchend events the browser fires in between.
  const handleStart = useCallback((e) => {
    e.preventDefault();
    if (activeRef.current) return;
    activeRef.current = true;
    onAction(action, true);
  }, [action, onAction]);

  const handleEnd = useCallback((e) => {
    e.preventDefault();
    if (!activeRef.current) return;
    activeRef.current = false;
    onAction(action, false);
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

const Spacer = () => <div className="touch-btn--spacer" />;

// The d-pad's top slot goes to the first of these a game uses.
const TOP_SLOT_OPTIONS = [
  { action: 'thrust', label: '\u25B2' },
  { action: 'up', label: '\u25B2' },
  { action: 'rotate', label: '\u21BB' },
];

const DPAD_BOTTOM_ROW = [
  { action: 'left', label: '\u25C0' },
  { action: 'down', label: '\u25BC' },
  { action: 'right', label: '\u25B6' },
];

function TouchControls({ controls, onAction }) {
  const has = (action) => controls.includes(action);
  const hasDpad = ['left', 'right', 'up', 'down'].some(has);
  const topSlot = TOP_SLOT_OPTIONS.find(({ action }) => has(action));

  return (
    <div className="touch-controls">
      <div className="touch-dpad">
        <Spacer />
        {topSlot ? (
          <TouchButton label={topSlot.label} action={topSlot.action} onAction={onAction} />
        ) : <Spacer />}
        <Spacer />

        {hasDpad && DPAD_BOTTOM_ROW.map(({ action, label }) => (has(action) ? (
          <TouchButton key={action} label={label} action={action} onAction={onAction} />
        ) : <Spacer key={action} />))}
      </div>

      <div className="touch-action-buttons">
        {has('fire') && (
          <TouchButton label="FIRE" action="fire" onAction={onAction} className="touch-action-btn" />
        )}
        {has('drop') && (
          <TouchButton label="DROP" action="drop" onAction={onAction} className="touch-action-btn" />
        )}
        {has('rotate') && hasDpad && (
          <TouchButton label={'\u21BB'} action="rotate" onAction={onAction} className="touch-action-btn" />
        )}
      </div>
    </div>
  );
}

export default TouchControls;
