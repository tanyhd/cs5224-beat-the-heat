import cx from 'classnames'
import styles from './Input.module.css';

export default function Input({classNameProps, ...props} : {classNameProps?: any, [props: string]: any}) {
   return (
      <input
         className={cx(styles.input, classNameProps)}
         {...props}
      />
   )
}