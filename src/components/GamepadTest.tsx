import { useEffect, useState, useRef } from 'react';
import './GamepadTest.css';

export default function GamepadTest({ onBack }: { onBack: () => void }) {
  // const [controller, setController] = useState<Gamepad | null>(null);
  const reqRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gps[0]; // Just test the first one
      if (gp) {
        // Clone the object because Gamepad objects are snapshot-like in some browsers or mutable references
        // We need a fresh object to trigger React state if we were relying on shallow compare, 
        // but forceUpdate is actually needed or deep clone.
        // setController(gp); 
      } else {
        // setController(null);
      }
      reqRef.current = requestAnimationFrame(update);
    };
    
    reqRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(reqRef.current!);
  }, []);

  // Force re-render loop effectively.
  // Actually, setting state with the SAME Gamepad object might not trigger re-render in React strict mode if reference is same?
  // Gamepad API returns the SAME object reference in Chrome but updates its properties.
  // To force React to update, we need to pass a new object/tick.
  const [, setTick] = useState(0);
  useEffect(() => {
     const loop = () => {
       setTick(t => t + 1);
       reqRef.current = requestAnimationFrame(loop);
     };
     reqRef.current = requestAnimationFrame(loop);
     return () => cancelAnimationFrame(reqRef.current!);
  }, []);

  const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;

  return (
    <div className="gamepad-test-container">
      <button className="back-btn" onClick={onBack}>Back to Menu</button>
      <h2>Gamepad Tester</h2>
      
      {!gp ? (
        <div className="no-gamepad">
          <p>No Controller Detected</p>
          <small>Press any button to wake it up</small>
        </div>
      ) : (
        <div className="gamepad-visualizer">
           <div className="gp-header">
             <strong>{gp.id}</strong>
             <span>Index: {gp.index}</span>
           </div>
           
           <div className="gp-axes">
             {gp.axes.map((axis, i) => (
               <div key={`axis-${i}`} className="axis-display">
                 <label>Axis {i}</label>
                 <div className="axis-bar-bg">
                    <div 
                      className="axis-bar-fill" 
                      style={{ 
                        width: '50%', 
                        left: '50%',
                        transform: `scaleX(${axis})`,
                        transformOrigin: axis > 0 ? 'left' : 'right',
                        backgroundColor: Math.abs(axis) > 0.1 ? '#3b82f6' : '#555' 
                      }} 
                    />
                    <span className="axis-value">{axis.toFixed(2)}</span>
                 </div>
               </div>
             ))}
           </div>

           <div className="gp-buttons">
             {gp.buttons.map((btn, i) => (
               <div key={`btn-${i}`} className={`btn-indicator ${btn.pressed ? 'pressed' : ''}`}>
                 <div className="btn-circle">
                   {btn.pressed && <div className="btn-fill" style={{ opacity: btn.value }} />}
                 </div>
                 <label>B{i}</label>
                 <small>{btn.value.toFixed(2)}</small>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
