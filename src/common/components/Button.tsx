import cx from 'classnames'
import styles from './Button.module.css';

const TYPE_MAPPING = {
   primary: styles.primary,
   secondary: styles.secondary,
}

interface ButtonProps {
   variant?: keyof typeof TYPE_MAPPING;
   classNameProps?: string;
   [props : string]: any;
}

export default function Button({classNameProps, variant, href, ...props} : ButtonProps) {
   const variantStyle = variant ? TYPE_MAPPING[variant] : TYPE_MAPPING['primary'];
   if (href) {
      return (
         <a href={href} className={cx(styles.button, variantStyle, classNameProps)} {...props} />
      )
   }
   return (
      <button
         className={cx(styles.button, variantStyle, classNameProps)}
         {...props}
      />
   )
}