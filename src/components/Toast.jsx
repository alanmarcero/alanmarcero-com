function Toast({ message, visible }) {
  return (
    <div className={`toast${visible ? ' toast--visible' : ''}`} role="status">
      {message}
    </div>
  );
}

export default Toast;
