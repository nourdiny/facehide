"use client";

import styles from "./toggle-switch.module.css";

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  label: string;
  description?: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSwitch({
  id,
  checked,
  label,
  description,
  disabled = false,
  onChange
}: ToggleSwitchProps) {
  return (
    <label className={styles.wrapper} htmlFor={id}>
      <span className={styles.textWrap}>
        <span className={styles.label}>{label}</span>
        {description ? <span className={styles.description}>{description}</span> : null}
      </span>
      <span className={styles.control}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className={styles.input}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.knob} />
        </span>
      </span>
    </label>
  );
}
