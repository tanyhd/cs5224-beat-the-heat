import React from 'react';
import cx from 'classnames';
import styles from './Notification.module.css';

export enum NotificationTypeEnum {
   SUCCESS = 'success',
   ERROR = 'error',
   WARNING = 'warning',
}

export type NotificationType = NotificationTypeEnum.SUCCESS | NotificationTypeEnum.ERROR | NotificationTypeEnum.WARNING | null;

interface NotificationProps {
   message: string | null;
   type: NotificationType;
   onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {

   const notificationClass = cx(styles.notification, {
      [styles.notificationSuccess]: type === NotificationTypeEnum.SUCCESS,
      [styles.notificationError]: type === NotificationTypeEnum.ERROR,
      [styles.notificationWarning]: type === NotificationTypeEnum.WARNING,
   });

   const handleClose = () => {
      document.querySelector(`.${styles.notification}`)?.classList.add(styles.hide);
      setTimeout(() => {
         onClose();
      }, 300);
   }

   React.useEffect(() => {
      const timer = setTimeout(() => {
         handleClose();
      }, 1200);

      return () => clearTimeout(timer);
   }, [message]);

   if (!message) return null;
   return (
      <div className={notificationClass}>
         <div className={styles.notificationContent}>
            <span className={styles.notificationMessage}>{message}</span>
            <button className={styles.notificationClose} onClick={handleClose}>
               ×
            </button>
         </div>
      </div>
   );
};

export default Notification;