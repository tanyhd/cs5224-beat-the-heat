import {cloneElement, JSX} from 'react'
import styles from './RoundedRectangleBackgroundIcon.module.css'

interface RoundedRectangleBackgroundIconProps {
   icon: JSX.Element;
}

export default function RoundedRectangleBackgroundIcon ({icon}: RoundedRectangleBackgroundIconProps) {
   return (
      <>
         {cloneElement(icon, {
            className: `${styles.icon} ${icon.props.className}`,
         })}
      </>
   )
}