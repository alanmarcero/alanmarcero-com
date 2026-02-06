import useScrollPosition from '../hooks/useScrollPosition';

function BackToTop() {
  const isPastThreshold = useScrollPosition(400);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      className={`back-to-top${isPastThreshold ? ' back-to-top--visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}

export default BackToTop;
