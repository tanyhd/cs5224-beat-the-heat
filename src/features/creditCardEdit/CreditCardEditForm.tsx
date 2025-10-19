'use client'

import { useState, useEffect } from "react";
import Button from "@/common/components/Button";
import styles from "./CreditCardEditForm.module.css";
import InputLabel from "@/common/components/InputLabel";
import CreditCard from "@/common/icons/CreditCard";
import Grid from "@/common/icons/Grid";
import Calendar from "@/common/icons/Calendar";
import ToggleLeft from "@/common/icons/ToggleLeft";
import ToggleRight from "@/common/icons/ToggleRight";
import SubDetails from '@/common/components/SubDetails';
import Dropdown from '@/common/components/Dropdown'
import Target from "@/common/icons/Target";

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

interface CreditCardEditFormProps {
    card: Card;
    onSave: (updatedCard: Card) => void;
    onCancel: () => void;
}

const formatCardNumber = (cardNumber: string): string => {
    return cardNumber.match(/.{1,4}/g)?.join('-') || cardNumber;
};

export default function CreditCardEditForm({ card, onSave, onCancel }: CreditCardEditFormProps) {
    const [editedCard, setEditedCard] = useState<Card>({ ...card });
    const [listOfCardsName, setListOfCardsName] = useState<string[]>([]);
    const [listOfCardsRewards, setListOfCardsRewards] = useState<{ title: string; rewardsId: string, imageUrl: string }[]>([]);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setEditedCard(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSave = () => {
        onSave(editedCard);
    };

    const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedTitle = e.target.value;
        const selectedReward = listOfCardsRewards.find((item) => item.title === selectedTitle);

        if (selectedReward) {
            setEditedCard(prev => ({
                ...prev,
                rewardsType: selectedReward.title,
                rewardsId: selectedReward.rewardsId,
                rewardsImageUrl: selectedReward.imageUrl,
            }));
        }
    };

    return (
        <div className={styles.formContainer}>
            <h3>Edit Credit Card</h3>
            <div className={styles.formGroup}>
                <InputLabel
                    labelProps={{
                        text: 'Card Number',
                    }}
                    inputProps={{
                        type: 'text',
                        name: 'cardNumber',
                        value: formatCardNumber(editedCard.cardNumber),
                        readOnly: true,
                        disabled: true
                    }}
                    icon={<CreditCard />}
                />
            </div>
            <div className={styles.formGroup}>
                <InputLabel
                    labelProps={{
                        text: 'Issuer',
                    }}
                    inputProps={{
                        type: 'text',
                        name: 'provider',
                        value: editedCard.provider,
                        onChange: handleInputChange,
                        readOnly: true,
                        disabled: true
                    }}
                    icon={<Grid />}
                />
            </div>
            <div className={styles.formGroup}>
                <InputLabel
                    labelProps={{
                        text: 'Expiry',
                    }}
                    inputProps={{
                        type: 'text',
                        name: 'expiry',
                        placeholder: 'MM/YYYY',
                        maxLength: 7,
                        value: editedCard.expiry,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            let { value } = e.target;
                            if (value.length === 2 && !value.includes('/')) {
                                value = value + '/';
                            }
                            setEditedCard(prev => ({ ...prev, expiry: value }));
                        },
                        pattern: '(0[1-9]|1[0-2])/20\\d{2}',
                        title: 'Expiry date must be in the format MM/YYYY',
                        required: true,
                        classNameProps: styles.input,
                        readOnly: true,
                        disabled: true
                    }}
                    icon={<Calendar />}
                />
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
                            value: editedCard.cardApprovalDate,
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                const { value } = e.target;
                                setEditedCard(prev => ({ ...prev, cardApprovalDate: value }));
                            },
                            required: true,
                        }}
                        icon={<Calendar />}
                    />
                </div>
                <div>
                    <SubDetails
                        details={{
                            label: 'Card Name',
                            subLabel: "Select a card name from the dropdown",
                            icon: <CreditCard stroke="#06B6D4" />,
                        }}
                    />
                    <Dropdown
                        label=""
                        name="rewardsType"
                        value={editedCard.rewardsType}
                        onChange={handleDropdownChange}
                        options={listOfCardsName}
                        icon={<CreditCard />}
                    />
                </div>
            </div>
            <div>
                <div className={styles.toggleWrapper}>
                    <div className={styles.headingWithIcon}>
                        <Target stroke="#06B6D4" />
                        <h3>Enable Tracking Expense</h3>
                    </div>
                    <span className={styles.toggleLabel}></span>
                    {editedCard.trackAllowed ? (
                        <ToggleRight
                            onClick={() =>
                                setEditedCard(prev => ({ ...prev, trackAllowed: false }))
                            }
                        />
                    ) : (
                        <ToggleLeft
                            className={styles.toggleLeft}
                            onClick={() =>
                                setEditedCard(prev => ({ ...prev, trackAllowed: true }))
                            }
                        />
                    )}
                </div>
            </div>
            <div className={styles.buttonGroup}>
                <Button variant="primary" onClick={handleSave} classNameProps={styles.button}>Save</Button>
                <Button variant="secondary" onClick={onCancel} classNameProps={styles.button}>Cancel</Button>
            </div>
        </div>
    );
}
