import { cloneElement } from 'react'
import Input from './Input'
import cx from 'classnames'
import styles from './InputLabel.module.css'

export default function InputLabel({ inputProps, labelProps, iconProps, icon }: { inputProps?: any, labelProps?: any, iconProps?:any, icon?: any }) {
   return (
      <div className={styles.container}>
         <label className={cx(styles.label, labelProps.className)} {...labelProps}>
            {labelProps.text}
         </label>
         <div className={styles.inputContainer}>
            <Input
               classNameProps={cx(styles.input, inputProps.className)}
               {...inputProps}
            />
            <div className={styles.iconWrapper}>
               {icon && cloneElement(icon, { ...iconProps, className: cx(styles.icon, iconProps?.className) })}
            </div>
         </div>
      </div>)
}