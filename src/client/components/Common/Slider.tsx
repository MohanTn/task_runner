import { useCallback } from 'react';
import styles from './Slider.module.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Slider({ label, value, min, max, step = 1, onChange, disabled }: SliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  return (
    <div className={styles.slider}>
      <div className={styles.header}>
        <label className={styles.label}>{label}</label>
        <span className={styles.value}>{value}</span>
      </div>
      <input
        type="range"
        className={styles.input}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        disabled={disabled}
      />
      <div className={styles.range}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
