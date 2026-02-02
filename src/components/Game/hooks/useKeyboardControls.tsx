import { useEffect, useState } from 'react';


interface KeyboardMap {
  [action: string]: string; // "KeyW,ArrowUp"
}

export const useKeyboardControls = (keyMap: KeyboardMap | null) => {
  const [controls, setControls] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    boost: false,
  });

  const [activeMap, setActiveMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Parse keyMap into a lookup: { "KeyW": "forward", "ArrowUp": "forward" }
    if (keyMap) {
      const lookup: Record<string, string> = {};
      Object.entries(keyMap).forEach(([action, keys]) => {
        keys.split(',').forEach(k => {
          lookup[k.trim()] = action;
        });
      });
      setActiveMap(lookup);
    }
  }, [keyMap]);

  useEffect(() => {
    if (!keyMap) return; // Wait for map

    const handleKeyDown = (e: KeyboardEvent) => {
      const action = activeMap[e.code];
      if (action) {
        setControls(c => ({ ...c, [action]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const action = activeMap[e.code];
      if (action) {
        setControls(c => ({ ...c, [action]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeMap, keyMap]);

  return controls;
};
