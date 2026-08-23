import { useMemo } from 'react';
import { faceplateLayout, blackKeys } from './faceplate';

const WIDTH = 480;
const HEIGHT = 170;

/**
 * The plan view an entry gets when no photograph of it exists.
 *
 * See `faceplate.js` for which three entries those are and why substituting
 * a lookalike photograph would be worse than drawing one.
 */
function FaceplatePlan({ seed, className = '' }) {
  const plan = useMemo(
    () => faceplateLayout({ seed, width: WIDTH, height: HEIGHT }),
    [seed],
  );
  const keys = useMemo(() => blackKeys(plan.keybed), [plan.keybed]);
  const keyStep = plan.keybed ? plan.keybed.width / plan.keybed.keys : 0;

  return (
    <svg
      className={`plan ${className}`}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        className="plan__chassis"
        x={plan.panel.x}
        y={plan.panel.y}
        width={plan.panel.width}
        height={plan.panel.height}
      />

      {plan.sections.map((section, index) => (
        <g key={section.x}>
          {index > 0 && (
            <line
              className="plan__divider"
              x1={section.x}
              y1={section.y}
              x2={section.x}
              y2={section.y + section.height}
            />
          )}
          <text className="plan__label" x={section.x + 9} y={section.y + 13}>
            {section.label}
          </text>
        </g>
      ))}

      {plan.controls.map((control, index) => {
        if (control.type === 'knob') {
          return (
            <g key={index} className="plan__knob">
              <circle cx={control.x} cy={control.y} r={control.radius} />
              <line
                x1={control.x}
                y1={control.y}
                x2={control.x + Math.sin(control.angle) * control.radius}
                y2={control.y - Math.cos(control.angle) * control.radius}
              />
            </g>
          );
        }

        if (control.type === 'slider') {
          const capY = control.y + control.length * (1 - control.position);
          return (
            <g key={index} className="plan__slider">
              <line
                x1={control.x}
                y1={control.y}
                x2={control.x}
                y2={control.y + control.length}
              />
              <rect x={control.x - 5} y={capY - 3} width="10" height="6" />
            </g>
          );
        }

        return (
          <rect
            key={index}
            className={`plan__switch${control.on ? ' plan__switch--on' : ''}`}
            x={control.x - control.width / 2}
            y={control.y - control.height / 2}
            width={control.width}
            height={control.height}
          />
        );
      })}

      {plan.keybed && (
        <g className="plan__keybed">
          <rect
            x={plan.keybed.x}
            y={plan.keybed.y}
            width={plan.keybed.width}
            height={plan.keybed.height}
          />
          {Array.from({ length: plan.keybed.keys - 1 }, (_, index) => (
            <line
              key={`white-${index}`}
              x1={plan.keybed.x + keyStep * (index + 1)}
              y1={plan.keybed.y}
              x2={plan.keybed.x + keyStep * (index + 1)}
              y2={plan.keybed.y + plan.keybed.height}
            />
          ))}
          {keys.map((key) => (
            <rect
              key={`black-${key.x}`}
              className="plan__black-key"
              x={key.x}
              y={key.y}
              width={key.width}
              height={key.height}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

export default FaceplatePlan;
