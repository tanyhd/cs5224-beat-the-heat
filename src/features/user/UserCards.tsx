'use client'

import { useState, useEffect, useRef} from "react";
import styles from './Cards.module.css'
import CreditCard from "@/common/icons/CreditCard";
import { ActionDetailBox } from "@/common/components/DetailBox";
import Button from "@/common/components/Button";
import CreditCardAddForm from "@/features/creditCardAdd/CreditCardAddForm";
import CreditCardEditForm from "@/features/creditCardEdit/CreditCardEditForm";
import Loading from "@/common/components/Loading";
import { LOADING_DELAY } from "@/common/constants/loadingDelay";
import Notification, {NotificationType, NotificationTypeEnum} from "@/common/components/Notification";

interface Card {
    cardNumber: string;
    provider: string;
    trackAllowed: boolean;
    cardApprovalDate: string;
    expiry: string;
    rewardsType: string;
    rewardsId: string;
    rewardsImageUrl: string;
}

export default function UserCards() {
    const [notificationState, setNotificationState] = useState({
        message: '',
        type: null as NotificationType,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [cards, setCards] = useState<Card[]>([]);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const token = typeof window !== 'undefined' && sessionStorage.getItem('userToken');
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
                    setTimeout(() => {
                        setIsLoading(false);
                    }
                    , LOADING_DELAY);
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
        token && fetchCards();
    }, []);

    const handleDeleteCard = async (cardNumber: string) => {
        const userToken = sessionStorage.getItem('userToken');

        try {
            const response = await fetch(`/api/cards/delete/${cardNumber}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
            });

            if (response.ok) {
                setCards(prevCards => prevCards.filter(card => card.cardNumber !== cardNumber));
                console.log(`Card ${cardNumber} deleted successfully.`);
                setNotificationState({
                    message: "Card deleted successfully.",
                    type: NotificationTypeEnum.SUCCESS,
                })
            } else {
                throw Error(`Failed to delete card ${cardNumber}.`);
            }
        } catch (error) {
            setNotificationState({
                message: error as string,
                type: NotificationTypeEnum.ERROR,
            })
        }
    };

    const handleEditCard = async (cardNumber: string) => {
        const cardToEdit = cards.find(card => card.cardNumber === cardNumber) || null;
        setEditingCard(cardToEdit);
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSaveEditedCard = async (updatedCard: Card) => {
        const userToken = sessionStorage.getItem('userToken');
        let payload: Record<string, any> =  {
            trackAllowed: updatedCard.trackAllowed,
            cardApprovalDate: updatedCard.cardApprovalDate,
            expiry: updatedCard.expiry,
            rewardsType: updatedCard.rewardsType,
            rewardsId: updatedCard.rewardsId,
            provider: updatedCard.provider,
            rewardsImageUrl: updatedCard.rewardsImageUrl
        }

        if (updatedCard.trackAllowed == false) {
            payload.expenses = [];
            payload.nextExpenseId = 0
        }

        try {
            const response = await fetch(`/api/cards/edit/${updatedCard.cardNumber}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setCards(prevCards =>
                    prevCards.map(card =>
                        card.cardNumber === updatedCard.cardNumber ? updatedCard : card
                    )
                );
                setNotificationState({
                    message: "Card updated successfully.",
                    type: NotificationTypeEnum.SUCCESS,
                })
                setEditingCard(null);
            } else {
                console.error('Failed to update card.');
            }
        } catch (error) {
            if (error instanceof Error) {
                setNotificationState({
                    message: error.message,
                    type: NotificationTypeEnum.ERROR,
                })
            } else {
                setNotificationState({
                    message: "System error, card update failed.",
                    type: NotificationTypeEnum.ERROR,
                })
            }
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loading />
            </div>
        )}

    return (
        <div className={styles.container}>
            <Notification
                message={notificationState.message}
                type={notificationState.type}
                onClose={() => {setNotificationState({ message: '', type: null })}}
            />
            <div>
                <div className={styles.cardsContainer}>
                    {cards.map((card) => {
                        const maskedCardNumber = `XXXX-XXXX-XXXX-${card.cardNumber.slice(-4)}`;
                        const details = {
                            topSubLabel: maskedCardNumber,
                            label: card.rewardsType && card.rewardsType.trim() !== ''
                                ? card.rewardsType
                                : card.provider,
                            subLabel: `Expires: ${card.expiry}`,
                            icon: <CreditCard stroke='#06B6D4' />,
                            image: card.rewardsImageUrl,
                            actions: [
                                <div className={styles.buttonGroup}>
                                    <Button variant="primary" onClick={() => handleEditCard(card.cardNumber)} classNameProps={styles.button}>Edit</Button>
                                    <Button variant="secondary" onClick={() => handleDeleteCard(card.cardNumber)} classNameProps={styles.button}>Delete</Button>
                                </div>
                            ]
                        };

                        return (
                            <ActionDetailBox
                                key={card.cardNumber}
                                id={card.cardNumber}
                                details={details}
                                cardClassName={styles.card}
                            />
                        );
                    })}
                </div>
            </div>
            <div ref={formRef} className={styles.formContainer}>
                {editingCard ? (
                    <CreditCardEditForm
                        card={editingCard}
                        onSave={handleSaveEditedCard}
                        onCancel={() => setEditingCard(null)}
                    />
                ) : (
                    <CreditCardAddForm />
                )}
            </div>
        </div>
    );
}