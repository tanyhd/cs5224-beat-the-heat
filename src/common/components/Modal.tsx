'use client'

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css'
import Button from './Button';
import cx from 'classnames';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAfterOpen?: () => void;
  children: React.ReactNode;
  modalContentClassName?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onAfterOpen, children, modalContentClassName }) => {
   const [isBrowser, setIsBrowser] = useState(false);
   const modalRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      setIsBrowser(true);
      if (isOpen && onAfterOpen) {
         onAfterOpen();
      }
   }, [isOpen, onAfterOpen]);

   const handleClose = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onClose) {
         onClose();
      }
   };

   if (!isBrowser) {
      return null;
   }

   const modalContent = isOpen ? (
      <div className={styles.modalOverlay}>
         <div
            className={cx(styles.modalContent, styles.modalContentClassName)}
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
         >
            {children}
            {onClose && <Button classNameProps={styles.modalClose} onClick={handleClose}>
               Close
            </Button>}
         </div>
      </div>
   ) : null;

   return ReactDOM.createPortal(modalContent, document?.body);
};

export default Modal;