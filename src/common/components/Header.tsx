import React from 'react';
import cx from 'classnames';
import styles from './Header.module.css';

interface HeaderProps {
   headerText: string;
   captionText?: string;
   containerClassName?: string;
   captionTextClassName?: string;
}

function Header ({headerText, captionText, containerClassName, captionTextClassName}: HeaderProps) {
   return (
      <div className={cx(styles.container, containerClassName)}>
         <h1 className={styles.header}>{headerText}</h1>
         {captionText && <p className={cx(styles.captionText, captionTextClassName)}>{captionText}</p>}
      </div>)
}

export default Header