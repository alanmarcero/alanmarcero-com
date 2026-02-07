function handleGlowMove(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
}

function handleGlowLeave(e) {
  e.currentTarget.style.removeProperty('--mouse-x');
  e.currentTarget.style.removeProperty('--mouse-y');
}

export const cardGlowHandlers = {
  onMouseMove: handleGlowMove,
  onMouseLeave: handleGlowLeave,
};
