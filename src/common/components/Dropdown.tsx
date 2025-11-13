import React from 'react'
import cx from 'classnames'
import styles from './Dropdown.module.css'

// Allow both string[] or { label, value }[] types
interface DropdownOption {
  label: string
  value: string
}

interface DropdownProps {
  options: (string | DropdownOption)[]
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  label?: string
  icon?: React.ReactElement
  className?: string
  iconWrapperClassName?: React.HTMLAttributes<HTMLDivElement>
}

export default function Dropdown({
  options,
  name,
  value,
  onChange,
  label,
  icon,
  className,
  iconWrapperClassName,
}: DropdownProps) {
  return (
    <div className={styles.dropdownWrapper}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.selectContainer}>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={cx(styles.select, className)}
        >
          {options.map((option, idx) =>
            typeof option === 'string' ? (
              <option key={idx} value={option}>
                {option}
              </option>
            ) : (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            )
          )}
        </select>
        {icon && (
          <div className={cx(styles.iconWrapper, iconWrapperClassName)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
