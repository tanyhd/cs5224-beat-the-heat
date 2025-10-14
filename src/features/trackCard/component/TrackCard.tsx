'use client'

import { useState, useEffect } from "react";
import CardSelector from "./CardSelector";
import CardInfo from "./CardInfo";
import TrackingSummary from "./TrackingSummary";
import ExpensesTable from "./ExpensesTable";
import Loading from "@/common/components/Loading";
import { LOADING_DELAY } from "@/common/constants/loadingDelay";
import styles from './TrackCard.module.css'
import Notification, {NotificationType, NotificationTypeEnum} from "@/common/components/Notification";

export default function TrackCard() {
   const [notificationState, setNotificationState] = useState({
      message: '',
      type: null as NotificationType,
   });
   const [isLoading, setIsLoading] = useState(true);
   const [cards, setCards] = useState<any[]>([]);
   const [selectedCard, setSelectedCard] = useState<any>(cards[0]);
   const [rewardsData, setRewardsData] = useState<any[]>([]);

   const fetchCards = async () => {
      try {
         const userToken = sessionStorage.getItem('userToken');
         const response = await fetch('/api/cards', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${userToken}`,
            },
         });
         if (response.ok) {
            const data = await response.json();
            setCards(data.message);
            setSelectedCard(data.message.find((card: any) => card?.cardNumber === selectedCard?.cardNumber));
         } else {
            throw new Error('Failed to fetch cards');
         }
      } catch (error) {
         setNotificationState({
            message: error as string,
            type: NotificationTypeEnum.ERROR,
         })
      }
   };
   useEffect(() => {
      const token = typeof window !== 'undefined' && sessionStorage.getItem('userToken');

      const fetchCardRewards = async () => {
         try {
            const response = await fetch(`/api/offers`);
            if (response.ok) {
               const data = await response.json();
               setRewardsData(data)
               setTimeout(() => {
                  setIsLoading(false);
               }, LOADING_DELAY);
            } else {
               throw new Error('Failed to fetch rewards data');
            }
         } catch (error) {
            setNotificationState({
               message: error as string,
               type: NotificationTypeEnum.ERROR,
            })
         }
      }
      token && fetchCards();
      token && fetchCardRewards();
   }, []);

   if (isLoading) {
      return (
         <div className={styles.loadingContainer}>
            <Loading />
         </div>
      )
   }

   return (<div>
      <Notification
         message={notificationState.message}
         type={notificationState.type}
         onClose={() => {setNotificationState({ message: '', type: null })}}
      />
      <p>
         Disclaimer: Most credit card expense bonuses exclude expenses on Hospitals, Insurance, Utilities, Education, and Charity.
      </p>
      <CardSelector cardDetails={cards} setSelectedCard={setSelectedCard} selectedCard={selectedCard}/>
      <CardInfo selectedCard={selectedCard} selectedRewardsData={rewardsData.find((reward) => selectedCard?.rewardsId === reward?.rewardsId)} fetchCards={fetchCards}/>
      <TrackingSummary 
         selectedCard={selectedCard} 
         selectedRewardsData={rewardsData.find((reward) => selectedCard?.rewardsId === reward?.rewardsId)} 
      />
      {selectedCard?.trackAllowed && <ExpensesTable selectedCard={selectedCard} fetchCards={fetchCards}/>}
   </div>)
}