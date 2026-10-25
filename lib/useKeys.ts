import { useEffect, useRef } from "react";

const BLOCKED = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export function useKeys() {
  const pressed = useRef(new Set<string>());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (BLOCKED.has(e.code)) e.preventDefault();
      pressed.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => pressed.current.delete(e.code);
    const clear = () => pressed.current.clear();

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  return pressed;
}