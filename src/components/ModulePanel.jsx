/**
 * ModulePanel — the shared synth-module chassis ("signal path" theme).
 * Renders the faceplate (panel border, LED indicator) and lets callers
 * compose module__* slots as children. Pure presentation, slot-based.
 */
function ModulePanel({ style, children, ...rest }) {
  return (
    <article className="module" style={style} {...rest}>
      <span className="module__led" aria-hidden="true" />
      {children}
    </article>
  );
}

export default ModulePanel;
