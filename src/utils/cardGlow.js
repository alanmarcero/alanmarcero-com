let pendingFrame = 0;

function handleGlowMove(e) {
  const target = e.currentTarget;
  const clientX = e.clientX;
  const clientY = e.clientY;

  cancelAnimationFrame(pendingFrame);
  pendingFrame = requestAnimationFrame(() => {
    const rect = target.getBoundingClientRect();
    target.style.setProperty('--mouse-x', `${clientX - rect.left}px`);
    target.style.setProperty('--mouse-y', `${clientY - rect.top}px`);
  });
}

function handleGlowLeave(e) {
  cancelAnimationFrame(pendingFrame);
  pendingFrame = 0;
  e.currentTarget.style.removeProperty('--mouse-x');
  e.currentTarget.style.removeProperty('--mouse-y');
}

export const cardGlowHandlers = {
  onMouseMove: handleGlowMove,
  onMouseLeave: handleGlowLeave,
};
