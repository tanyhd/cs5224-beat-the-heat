import { useState, useRef } from "react"
import ExpensesForm from "./ExpensesForm"
import TableRow from "@/common/components/TableRow";
import Edit from "@/common/icons/Edit";
import Trash from "@/common/icons/Trash";
import Notification, { NotificationType, NotificationTypeEnum } from "@/common/components/Notification";
import styles from "./ExpensesTable.module.css";
import Button from "@/common/components/Button";

interface ExpensesTableProps {
   selectedCard: any
   fetchCards: () => void
}

export enum FormMode {
   ADD = 'add',
   EDIT = 'edit',
}

export default function ExpensesTable({ selectedCard, fetchCards }: ExpensesTableProps) {
   const [notificationState, setNotificationState] = useState({
      message: '',
      type: null as NotificationType,
   });
   const [formMode, setFormMode] = useState(FormMode.ADD);
   const [expenseIdToEdit, setExpenseIdToEdit] = useState<string | null>(null);
   const { expenses, trackAllowed } = selectedCard || {};
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const formRef = useRef<HTMLDivElement>(null);

   const handleEditExpense = (expenseId: string) => {
      setFormMode(FormMode.EDIT);
      setExpenseIdToEdit(expenseId);
      setTimeout(() => {
         formRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
   }

   const handleDeleteExpense = async (expenseId: string) => {
      const authHeader = sessionStorage.getItem('userToken');
      if (!authHeader) {
         console.error('Authorization header missing or invalid');
         return;
      }
      const url = `/api/expenses/delete/${selectedCard.cardNumber}`;
      try {
         const response = await fetch(url, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${authHeader}`,
            },
            body: JSON.stringify({ expenseId }),
         });
         if (response.ok) {
            setNotificationState({
               message: 'Expense deleted successfully!',
               type: NotificationTypeEnum.SUCCESS,
            })
            fetchCards();
         } else {
            throw new Error('Failed to delete expense');
         }
      } catch (error) {
         console.error(error);
         setNotificationState({
            message: 'Error deleting expense',
            type: NotificationTypeEnum.ERROR,
         })
      }
   }

   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('type', 'ocbc-credit-card');

      try {
         const extractResult = await fetch('/api/extractPDF', {
            method: 'POST',
            body: formData,
         });

         if (!extractResult.ok) throw new Error(await extractResult.text());

         const data = await extractResult.json();
         const payload = {
            cardNumber: selectedCard.cardNumber,
            expenses: data.rows
         }

         const addResult = await fetch('/api/expenses/addAll', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${sessionStorage.getItem('userToken')}`,
            },
            body: JSON.stringify(payload)
         });

         if (addResult.ok) {
            setNotificationState({
               message: 'Expenses added successfully!',
               type: NotificationTypeEnum.SUCCESS,
            });
            fetchCards();
         } else {
            throw new Error('Failed to add expenses');
         }
      } catch (err: any) {
         setError(err.message);
         setNotificationState({
            message: err.message,
            type: NotificationTypeEnum.ERROR,
         })
      } finally {
         setLoading(false);
         if (fileInputRef.current) {
            fileInputRef.current.value = '';
         }
      }
   };

   if (!trackAllowed) {
      return null;
   }

   return (
      <div>
         <Notification
            message={notificationState.message}
            type={notificationState.type}
            onClose={() => { setNotificationState({ message: '', type: null }) }}
         />
         <h3 style={{ margin: '36px 0 24px' }}>Expenditure Tracking</h3>
         <table>
            <thead>
               <TableRow>
                  <th style={{ textAlign: 'left' }}>Date</th>
                  <th style={{ textAlign: 'left' }}>Merchant Name</th>
                  <th style={{ textAlign: 'left' }}>MCC</th>
                  <th style={{ textAlign: 'left' }}>Merchant Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
               </TableRow>
            </thead>
            <tbody>
               {expenses?.length > 0 ? (
                  expenses.map((expense: any) => (
                     <TableRow key={expense.expenseId}>
                        <td style={{ textAlign: 'left' }}>{expense.date}</td>
                        <td style={{ textAlign: 'left' }}>{expense.storeName}</td>
                        <td style={{ textAlign: 'left' }}>{expense.mcc}</td>
                        <td style={{ textAlign: 'left' }}>{expense.mccDescription}</td>
                        <td style={{ textAlign: 'right' }}>${expense.amount}</td>
                        <td style={{ textAlign: 'right', cursor: 'pointer' }}>
                           <Edit onClick={() => handleEditExpense(expense?.expenseId)} style={{ marginRight: '12px' }} />
                           <Trash onClick={() => handleDeleteExpense(expense?.expenseId)} />
                        </td>
                     </TableRow>
                  ))
               ) : (
                  <TableRow>
                     <td colSpan={6} style={{ textAlign: 'center' }}>No expenses recorded yet. <br /> Please add an expense</td>
                  </TableRow>
               )}
            </tbody>
         </table>
         <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <h3>Upload OCBC Credit Card Statement</h3>
            <input type="file" accept="application/pdf" onChange={handleFileChange} ref={fileInputRef} className={styles.uploadButton}/>
            {loading && <p>Extracting PDF...</p>}
         </div>
         <div ref={formRef}>
            <ExpensesForm
               selectedCard={selectedCard}
               fetchCards={fetchCards}
               formMode={formMode}
               setFormMode={setFormMode}
               expenseIdToEdit={expenseIdToEdit}
               setExpenseIdToEdit={setExpenseIdToEdit}
            />
         </div>
      </div>
   )
}