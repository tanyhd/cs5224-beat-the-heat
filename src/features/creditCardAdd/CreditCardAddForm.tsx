'use client';

import React, { useEffect, useState } from 'react';
import styles from './CreditCardAddForm.module.css'
import Button from "@/common/components/Button";
import InputLabel from "@/common/components/InputLabel";
import CreditCard from "@/common/icons/CreditCard";
import Avatar from "@/common/icons/Avatar";
import Calendar from '@/common/icons/Calendar';
import Grid from '@/common/icons/Grid';
import Lock from '@/common/icons/Lock';
import ToggleLeft from "@/common/icons/ToggleLeft";
import ToggleRight from "@/common/icons/ToggleRight";
import SubDetails from '@/common/components/SubDetails';
import Dropdown from '@/common/components/Dropdown'
import Target from "@/common/icons/Target";
import SlimArrowRight from '@/common/icons/SlimArrowRight';
import Notification, { NotificationType, NotificationTypeEnum } from "@/common/components/Notification";
import cx from 'classnames';
import Modal from '@/common/components/Modal';

export default function CreditCardAddForm() {
   const [showOtpModal, setShowOtpModal] = useState(false);
   const [otpCode, setOtpCode] = useState('');
   const [notificationState, setNofificationState] = useState({
      message: '',
      type: null as NotificationType
   })
   const [listOfCardsRewards, setListOfCardsRewards] = useState<{ title: string; rewardsId: string, imageUrl: string }[]>([]);
   const [listOfCardsName, setListOfCardsName] = useState<string[]>([]);
   const [formData, setFormData] = useState({
      provider: '',
      name: '',
      cardNumber: '',
      cvv: '',
      expiry: '',
      trackAllowed: false,
      cardApprovalDate: '',
      rewardsType: '',
      rewardsId: '',
      rewardsImageUrl: '',
   });
   
   useEffect(() => {
      setFormData((prev => ({
         ...prev,
         rewardsType: listOfCardsName[0] || ''
      })));
   }, [listOfCardsName]);

   useEffect(() => {
      const fetchOffersCardTitle = async () => {
         try {
            const userToken = sessionStorage.getItem('userToken');
            const response = await fetch('/api/offers', {
               method: 'GET',
               headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${userToken}`,
               },
            });

            if (response.ok) {
               const data = await response.json();
               setListOfCardsRewards(data); 
               const titles = data.map((item: { title: string }) => item.title);
               setListOfCardsName(titles);
            } else {
               console.error('Failed to fetch cards');
            }
         } catch (error) {
            console.error('Error fetching card titles:', error);
         }
      };
      fetchOffersCardTitle();
   }, []);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
   };

   const formatCardNumber = (value: string) => {
      return value.replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
   };

   const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const rawValue = value.replace(/\D/g, '').slice(0, 16); // digits only, max 16
      setFormData((prev) => {
         let provider = '';
         if (rawValue.startsWith('4')) {
         provider = 'Visa';
         } else if (rawValue.startsWith('2') || rawValue.startsWith('5')) {
         provider = 'MasterCard';
         } else if (rawValue.startsWith('3')) {
         provider = 'American Express';
         }
         return { ...prev, [name]: rawValue, provider };
      });
   };

   const handleVerifyOtp = async (e: React.FormEvent) => {
      setShowOtpModal(true);
      e.preventDefault();
      // return // this is a placeholder to be activated if want to bypass the OTP
      try {
         const userToken = sessionStorage.getItem('userToken');
         const otpResponse = await fetch('/api/otp/verify', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${userToken}`,
            },
         });

         if (!otpResponse.ok) {
            throw new Error('Failed to trigger OTP');
         }
         setShowOtpModal(true);
      } catch (error) {
         console.error('Error triggering OTP:', error);
      }
   }

   const handleConfirmOTP = async (otpToken: string) => {
      // add this bypass for testing only to ensure other devs are not blocked
      if (otpToken === '123456') {
         setShowOtpModal(false);
         handleSubmit();
         return;
      }
      try {
         const userToken = sessionStorage.getItem('userToken');

         const confirmResponse = await fetch('/api/otp/confirm', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({ token: otpToken }),
         });

         if (!confirmResponse.ok) {
            throw new Error('OTP confirmation failed');
         }

         const confirmData = await confirmResponse.json();

         if (confirmData.status !== 'approved') {
            throw new Error('OTP not approved');
         }

         setShowOtpModal(false);
         handleSubmit();
      } catch (error) {
         setNofificationState({
            message: 'Error confirming OTP',
            type: NotificationTypeEnum.ERROR
         })
      }
   }

   const handleSubmit = async () => {
      const selectedReward = listOfCardsRewards.find((item) => item.title === formData.rewardsType);
      formData.rewardsImageUrl = selectedReward ? selectedReward.imageUrl : '';
      formData.rewardsId = selectedReward ? selectedReward.rewardsId : '';
      try {
         const userToken = sessionStorage.getItem('userToken');
         const response = await fetch('/api/cards/add', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify(formData),
         });
         if (!response.ok) {
            throw new Error('Failed to add card');
         }
         setNofificationState({
            message: 'Card added successfully',
            type: NotificationTypeEnum.SUCCESS
         })
         window.location.reload();
      } catch (error) {
         console.error(error);
         setNofificationState({
            message: 'Error adding card',
            type: NotificationTypeEnum.ERROR
         })
      }
   };

   const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedTitle = e.target.value;
      const selectedReward = listOfCardsRewards.find((item) => item.title === selectedTitle);
    
      if (selectedReward) {
        setFormData({
          ...formData,
          rewardsType: selectedReward.title,
          rewardsId: selectedReward.rewardsId,
          rewardsImageUrl: selectedReward.imageUrl,
        });
      }
    };

   return (
      <form onSubmit={handleVerifyOtp} className={styles.formContainer}>
         <Modal
            isOpen={showOtpModal}
            modalContentClassName={styles.modalContentContainer}
         >
            <div className={styles.modalContent}>
                  <h2>Input OTP Token</h2>
                  <div className={cx(styles.inputLabel, styles.otpInput)}>
                    <InputLabel
                      labelProps={{
                        text: 'OTP Code',
                      }}
                      inputProps={{
                        type: 'text',
                        name: 'otpCode',
                        placeholder: 'Enter OTP',
                        maxLength: 6,
                        required: true,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                           const { value } = e.target;
                           if (/^\d*$/.test(value)) { // Allow only numeric input
                             setOtpCode(value);
                           }
                        },
                      }}
                    />
                     <Button
                        variant="primary"
                        classNameProps={styles.otpButton}
                        onClick={() => handleConfirmOTP(otpCode)}
                        >
                        Submit OTP
                     </Button>
                  </div>
            </div>
         </Modal>
         <Notification
            message={notificationState.message}
            type={notificationState.type}
            onClose={() => {setNofificationState({ message: '', type: null })}}
         />
         <h3>Add New Card</h3>
         <div>
            <div className={styles.inputLabel}>
               <InputLabel
                  labelProps={{
                     text: 'Card Number',
                  }}
                  inputProps={{
                     type: 'text',
                     name: 'cardNumber',
                     value: formatCardNumber(formData.cardNumber),
                     onChange: handleCardChange,
                     maxLength: 19,
                     pattern: '\\d{4} \\d{4} \\d{4} \\d{4}',
                     title: 'Card number must be 16 digits in the format XXXX-XXXX-XXXX-XXXX',
                     placeholder: 'XXXX-XXXX-XXXX-XXXX',
                     required: true,
                  }}
                  icon={<CreditCard />}
               />
            </div>
         </div>
         <div>
            <div className={styles.inputLabel}>
               <InputLabel
                  labelProps={{
                     text: 'Issuer',
                  }}
                  inputProps={{
                     type: 'text',
                     name: 'provider',
                     placeholder: 'Visa, Master Card or American Express',
                     value: formData.provider,
                     onChange: handleChange,
                     required: true,
                     disabled: true,
                  }}
                  icon={<Grid />}
               />
            </div>
         </div>
         <div>
            <div className={styles.inputLabel}>
               <InputLabel
                  labelProps={{
                     text: 'Name',
                  }}
                  inputProps={{
                     type: 'text',
                     name: 'name',
                     placeholder: 'John Doe',
                     value: formData.name,
                     onChange: handleChange,
                     required: true,
                  }}
                  icon={<Avatar />}
               />
            </div>
         </div>
         <div className={styles.formRow}>
            <div className={styles.inputLabel}>
               <InputLabel
                  labelProps={{
                     text: 'Expiry',
                  }}
                  inputProps={{
                     type: 'text',
                     name: 'expiry',
                     placeholder: 'MM/YYYY',
                     maxLength: 7,
                     value: formData.expiry,
                     onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        let { value } = e.target;
                        if (value.length === 2 && !value.includes('/')) {
                           value = value + '/';
                        }
                        setFormData((prev) => ({ ...prev, expiry: value }));
                     },
                     pattern: '(0[1-9]|1[0-2])/20\\d{2}',
                     title: 'Expiry date must be in the format MM/YYYY',
                     required: true,
                     classNameProps: styles.input,
                  }}
                  icon={<Calendar />}
               />
            </div>
            <div className={styles.inputLabel}>
               <InputLabel
                  labelProps={{
                     text: 'CVV',
                  }}
                  inputProps={{
                     type: 'text',
                     name: 'cvv',
                     value: formData.cvv,
                     onChange: handleChange,
                     maxLength: 4,
                     required: true,
                     classNameProps: styles.input,
                  }}
                  icon={<Lock />}
               />
            </div>
         </div>
         <div className={styles.trackingContainer}>
            <div className={styles.inputLabel}>
               <InputLabel
                  labelProps={{
                     text: 'Card Approval',
                  }}
                  inputProps={{
                     type: 'date',
                     name: 'cardApprovalDate',
                     value: formData.cardApprovalDate,
                     onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const { value } = e.target;
                        setFormData((prev) => ({ ...prev, cardApprovalDate: value }));
                     },
                     required: true,
                     onClick: (e: React.MouseEvent<HTMLInputElement>) => {
                        const input = e.target as HTMLInputElement;
                        input.showPicker();
                     }
                  }}
                  icon={<Calendar />}
               />
            </div>
            <div className={styles.inputLabel}>
               <SubDetails details={{
                  label: 'Card Name',
                  subLabel: "Select a card name from the dropdown",
                  icon: <CreditCard stroke='#FF5B27' />
               }} />
               <Dropdown
                  label=""
                  name="rewardsType"
                  value={formData.rewardsType}
                  onChange={handleDropdownChange}
                  options={listOfCardsName}
                  icon={<SlimArrowRight />}
               />
            </div>
         </div>
         <div>
            <div className={styles.toggleWrapper}>
               <div className={styles.headingWithIcon}>
                  <Target stroke="#FF5B27" />
                  <h3>Enable Tracking Expense</h3>
               </div>
               <span className={styles.toggleLabel}></span>
               {formData.trackAllowed ? (
                  <ToggleRight onClick={() => setFormData((prev) => ({ ...prev, trackAllowed: false }))} />
               ) : (
                  <ToggleLeft
                     className={styles.toggleLeft}
                     onClick={() => setFormData((prev) => ({ ...prev, trackAllowed: true }))}
                  />
               )}
            </div>
         </div>
         <Button variant="primary" type="submit" classNameProps={styles.button}>Save Card</Button>
      </form>
   );
}