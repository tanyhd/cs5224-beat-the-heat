import React, { useEffect, useState } from 'react';
import { FormMode } from './ExpensesTable';
import Button from '@/common/components/Button';
import styles from './ExpensesForm.module.css'
import InputLabel from '@/common/components/InputLabel';
import Calendar from '@/common/icons/Calendar';
import DollarSign from '@/common/icons/DollarSign';
import Grid from '@/common/icons/Grid';
import Info from '@/common/icons/Info';
import FileText from '@/common/icons/FileText';
import Notification, { NotificationType, NotificationTypeEnum } from '@/common/components/Notification';

function capitalize(text: string): string {
   if (!text) return text;
   return text.charAt(0).toUpperCase() + text.slice(1);
}

interface AddExpensesProps {
   selectedCard: any;
   fetchCards: () => void;
   formMode: string;
   setFormMode: React.Dispatch<React.SetStateAction<FormMode>>;
   expenseIdToEdit: string | null;
   setExpenseIdToEdit: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ExpensesForm({ selectedCard, fetchCards, formMode, setFormMode, expenseIdToEdit, setExpenseIdToEdit }: AddExpensesProps) {
   const [notificationState, setNotificationState] = useState({
      message: '',
      type: null as NotificationType,
   });
   const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      const formData = new FormData(event.target as HTMLFormElement);
      const expenseDetails: {
         date: FormDataEntryValue | null;
         amount: FormDataEntryValue | null;
         mcc: FormDataEntryValue | null;
         mccDescription: FormDataEntryValue | null;
         storeName: FormDataEntryValue | null;
         expenseId?: string | null;
      } = {
         date: formData.get('date'),
         amount: formData.get('amount'),
         mcc: formData.get('mcc'),
         mccDescription: formData.get('mccDescription'),
         storeName: formData.get('storeName'),
      };

      if (expenseIdToEdit) {
         expenseDetails.expenseId = expenseIdToEdit;
      }

      const creditCardNumber = selectedCard.cardNumber;
      const url = `/api/expenses/${formMode}/${creditCardNumber}`;

      try {
         const response = await fetch(url, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${sessionStorage.getItem('userToken')}`,
            },
            body: JSON.stringify(expenseDetails),
         });

         if (!response.ok) {
            throw new Error(`Failed to ${formMode} expense`);
         }

         setNotificationState({
            message: `Expense ${formMode}ed successfully!`,
            type: NotificationTypeEnum.SUCCESS,
         });
         (event.target as HTMLFormElement).reset();
         fetchCards();
         setFormMode(FormMode.ADD);
      } catch (error) {
         console.error(error);
         setNotificationState({
            message: `Error ${formMode}ing expense`,
            type: NotificationTypeEnum.ERROR,
         });
      }
   };

   const handleMerchantSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData((e.currentTarget as HTMLButtonElement).form as HTMLFormElement);
      const name = formData.get("merchantName");
      const city = 'Los Angeles';
      const address = '';

      const response = await fetch(
         `/api/merchants/search?name=${name}&city=${city}&address=${address}`
      );
      const data = await response.json();
      const firstResult = data?.merchantSearchServiceResponse?.response?.[0]?.responseValues;

      if (firstResult) {
         (document.querySelector('input[name="mcc"]') as HTMLInputElement)!.value = firstResult?.primaryMerchantCategoryCode;
         (document.querySelector('input[name="mccDescription"]') as HTMLInputElement)!.value = firstResult?.merchantCategoryCodeDesc?.[0];
         (document.querySelector('input[name="storeName"]') as HTMLInputElement)!.value = firstResult?.visaStoreName;
      } else {
         setNotificationState({
            message: 'No merchant information found',
            type: NotificationTypeEnum.WARNING,
         })
      }
   }

   const handleAddExpense = () => {
      setFormMode(FormMode.ADD);
      setExpenseIdToEdit(null);
      (document.getElementById('expenseForm') as HTMLFormElement).reset();
   }

   useEffect(() => {
      if (expenseIdToEdit && formMode === FormMode.EDIT) {
         const expenseToEdit = selectedCard.expenses.find((expense: any) => expense.expenseId === expenseIdToEdit);
         if (expenseToEdit) {
            (document.querySelector('input[name="date"]') as HTMLInputElement)!.value = expenseToEdit.date || '';
            (document.querySelector('input[name="amount"]') as HTMLInputElement)!.value = expenseToEdit.amount || '';
            (document.querySelector('input[name="mcc"]') as HTMLInputElement)!.value = expenseToEdit.mcc || '';
            (document.querySelector('input[name="mccDescription"]') as HTMLInputElement)!.value = expenseToEdit.mccDescription || '';
            (document.querySelector('input[name="storeName"]') as HTMLInputElement)!.value = expenseToEdit.storeName || '';
         }
      }
   }, [expenseIdToEdit])

   return (
      <>
         <Notification 
            message={notificationState.message}
            type={notificationState.type}
            onClose={() => {setNotificationState({message: '', type: null})}}
         />
         <h3 className={styles.subHeader}>Add New Expense</h3>
         <form id="expenseForm" onSubmit={handleSubmit}>
            <div className={styles.inputGroupOne}>
               <div className={styles.inputLabel}>
                  <InputLabel 
                     labelProps={{text: 'Date'}}
                     inputProps={{
                        type: "date",
                        name: "date",
                        required: true,
                        classNameProps: styles.input,
                     }}
                     icon={<Calendar />}
                  />
               </div>
               <div className={styles.inputLabel}>
                  <InputLabel 
                     labelProps={{text: 'Amount'}}
                     inputProps={{
                        type: "float",
                        name: "amount",
                        placeholder: "$ 0.00",
                        required: true,
                        classNameProps: styles.input,
                     }}
                     icon={<DollarSign />}
                  />
               </div>
            </div>
            <div className={styles.inputGroupTwo}>
               <div className={styles.inputLabel}>
                  <InputLabel
                     labelProps={{text: 'Merchant Name'}}
                     inputProps={{
                        type: "text",
                        name: "merchantName",
                        classNameProps: styles.input,
                     }}
                     icon={<Grid />}
                  />
               </div>
               <Button classNameProps={styles.searchButton} type="Button" variant="secondary" form="expenseForm" onClick={handleMerchantSearch}>Search Merchant Info</Button>
            </div>
            <div className={styles.inputGroupThree}>
               <div className={styles.inputLabel}>
                  <InputLabel 
                     labelProps={{text: 'Store Name'}}
                     inputProps={{
                        type: "text",
                        name: "storeName",
                        required: true,
                        classNameProps: styles.input,
                     }}
                     icon={<Grid />}
                  />
               </div>
            </div>
            <div className={styles.inputGroupFour}>
               <div className={styles.inputLabel}>
                  <InputLabel 
                     labelProps={{text: 'MCC'}}
                     inputProps={{
                        type: "text",
                        name: "mcc",
                        required: true,
                        classNameProps: styles.input,
                     }}
                     icon={<Info />}
                  />
               </div>
               <div className={styles.inputLabel}>
                  <InputLabel
                     labelProps={{text: 'MCC Description'}}
                     inputProps={{
                        type: "text",
                        name: "mccDescription",
                        required: true,
                        classNameProps: styles.input,
                     }}
                     icon={<FileText />}
                  />
               </div>
            </div>
            <div className={styles.buttonGroup}>
               {formMode === FormMode.EDIT && <Button type="button" variant="secondary" classNameProps={styles.button} onClick={handleAddExpense}>Cancel Edit Expense</Button>}
               <Button type="submit" classNameProps={styles.button}>{capitalize(formMode)} Expense</Button>
            </div>
         </form>
      </>
   );
}