import {cloneElement, JSX} from 'react'
import styles from './CircularBackgroundIcon.module.css'

interface CircularBackgroundIconProps {
   icon: JSX.Element;
}

export default function CircularBackgroundIcon ({icon}: CircularBackgroundIconProps) {
   return (
      <>
         {cloneElement(icon, {
            className: `${styles.icon} ${icon.props.className}`,
         })}
      </>
   )
}