import React from 'react';
import styles from './ShelterSlider.module.css';

interface ShelterSliderProps {
  value: number; // 0-100
  onChange: (value: number) => void;
  disabled?: boolean;
}

const ShelterSlider: React.FC<ShelterSliderProps> = ({ value, onChange, disabled = false }) => {
  const getLabel = (val: number): string => {
    if (val === 0) return 'No Shelter';
    if (val <= 25) return 'Minimal Shelter';
    if (val <= 50) return 'Moderate Shelter';
    if (val <= 75) return 'High Shelter';
    return 'Maximum Shelter';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <label className={styles.label}>Shelter Preference</label>
        <span className={styles.value}>{getLabel(value)}</span>
      </div>
      <div className={styles.sliderWrapper}>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={styles.slider}
          aria-label="Shelter preference"
        />
        <div className={styles.marks}>
          <span className={styles.mark}>None</span>
          <span className={styles.mark}>Min</span>
          <span className={styles.mark}>Mod</span>
          <span className={styles.mark}>High</span>
          <span className={styles.mark}>Max</span>
        </div>
      </div>
    </div>
  );
};

export default ShelterSlider;
