import CircularBackgroundIcon from './CircularBackgroundIcon';
import cx from 'classnames';
import styles from './DetailBox.module.css';
import { JSX } from 'react';
import CreditCard from '../icons/CreditCard';

interface DetailBoxProps {
   key: string | number;
   id: string | number;
   cardClassName?: string;
   details: {
      label: string;
      topSubLabel?: string;
      subLabel: string | JSX.Element;
      link?: string;
      newTab?: boolean;
      linkText?: string;
      icon?: JSX.Element;
      actions?: JSX.Element[];
      image?: string;
   };
}

export function LinkDetailBox({id, details, cardClassName} : DetailBoxProps) {
   return (
      <div key={id} className={cx(cardClassName, styles.card)}>
         {details.icon && <CircularBackgroundIcon icon={details.icon} />}
         <h3 className={styles.cardLabel}>{details.label}</h3>
         <p className={styles.cardSubLabel}>{details.subLabel}</p>
         {details?.link && details?.newTab && 
            <a href={`https://${details.link}`} target="_blank" className={styles.cardLink}>{details.linkText}</a>
         }
         {details?.link && !details?.newTab && 
            <a href={`${details.link}`} className={styles.cardLink}>{details.linkText}</a>
         }
      </div>)
}
export async function isPortraitImage(imageSrc: string): Promise<boolean> {
   return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
         resolve(img.height > img.width);
      };
      img.src = imageSrc;
   });
}
import { useEffect, useState } from 'react';

export function ActionDetailBox({id, details} : DetailBoxProps) {
   const [isPortrait, setIsPortrait] = useState<boolean>(false);

   useEffect(() => {
      if (details.image) {
         isPortraitImage(details.image).then(setIsPortrait);
      }
   }, [details.image]);

   return (
      <div key={id} className={styles.actionCard}>
         <div className={styles.cardContainer}>
            {details.icon && <CircularBackgroundIcon icon={details.icon} />}
            <p className={styles.cardTopSubLabel}>{details.topSubLabel}</p>
            <h3 className={styles.cardLabel}>{details.label}</h3>
            <p className={styles.cardSubLabel}>{details.subLabel}</p>
            {details?.actions && details.actions?.map((action, index) => (
               <div key={index} className={styles.action}>
                  {action}
               </div>
            ))}
         </div>
         {details.image && isPortrait &&
            <div className={styles.cardImageContainer}>
               {details.image && <img src={details.image} alt="Card" className={styles.cardImagePortrait} />}
            </div>
         }
         {details.image && !isPortrait &&
            <img src={details.image} alt="Card" className={styles.cardImage} />
         }
      </div>)
}