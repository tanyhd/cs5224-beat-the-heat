import RoundedRectangleBackgroundIcon from './RoundedRectangleBackgroundIcon';
import styles from './SubDetails.module.css';

interface SubDetailsProps {
   details: {
      label: string;
      subLabel: string;
      linkText?: string;
      link?: string;
      icon?: React.JSX.Element;
   };
   [props: string]: any;
}

export default function SubDetails({ details, ...props }: SubDetailsProps) {
   return (
      <div className={styles.container}>
         {details.icon ? (
            <RoundedRectangleBackgroundIcon icon={details.icon} />
         ) : null}
         <div>
            <p className={styles.label}>
               {details.label}
            </p>
            <p className={styles.subLabel}>
               {details.subLabel}
            </p>
         </div>
      </div>
   )
}