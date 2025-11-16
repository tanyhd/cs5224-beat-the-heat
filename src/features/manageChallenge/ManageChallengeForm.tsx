'use client';

import React, { useEffect, useState } from 'react';
import styles from './ManageChallengeForm.module.css';
import Button from "@/common/components/Button";
import InputLabel from "@/common/components/InputLabel";
import CreditCard from "@/common/icons/CreditCard";
import Calendar from '@/common/icons/Calendar';
import ToggleLeft from "@/common/icons/ToggleLeft";
import ToggleRight from "@/common/icons/ToggleRight";
import SubDetails from '@/common/components/SubDetails';
import Dropdown from '@/common/components/Dropdown';
import Target from "@/common/icons/Target";
import SlimArrowRight from '@/common/icons/SlimArrowRight';
import Notification, { NotificationType, NotificationTypeEnum } from "@/common/components/Notification";

// master list of challenges
export interface Challenge {
  _id?: string;
  title?: string;
  description?: string;
  dateTime?: string;
  imgUrl?: string;
  href?: string;
  fee?: string;
  source?: string;
  status?: string;
}

// user-added challenge (from userChallenges collection)
export interface UserChallenge {
  _id?: string;
  challengeId: string;
  challengeName: string;
  startDate: string;
  trackAllowed: boolean;
   status?: string;
}

export default function ManageChallengeForm() {
  const [notificationState, setNotificationState] = useState<{
    message: string;
    type: NotificationType | null;
  }>({ message: '', type: null });

  const [listOfChallenges, setListOfChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [formData, setFormData] = useState<{
    challengeId: string;
    challengeName: string;
    startDate: string;
    trackAllowed: boolean;
  }>({
    challengeId: '',
    challengeName: '',
    startDate: '',
    trackAllowed: false,
  });

  // Fetch master challenge list
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const userToken = sessionStorage.getItem('userToken');
        const res = await fetch('/api/challengeHub', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`,
          },
        });

        if (res.ok) {
          const data: Challenge[] = await res.json();
          setListOfChallenges(data);

          if (data.length > 0) {
            setFormData(prev => ({
              ...prev,
              challengeId: data[0]._id || '',
              challengeName: data[0].title || '',
            }));
          }
        } else {
          console.error('❌ Failed to fetch challenges');
        }
      } catch (err) {
        console.error('Error fetching challenges:', err);
      }
    };

    fetchChallenges();
  }, []);

  // Fetch user-added challenges
  useEffect(() => {
    const fetchUserChallenges = async () => {
      try {
        const userToken = sessionStorage.getItem('userToken');
        if (!userToken) return;

         const res = await fetch("/api/challenge/get", {
         method: "GET",
         headers: {
            "Authorization": `Bearer ${userToken}`,
         },
         });

        if (res.ok) {
          const data = await res.json();
          setUserChallenges(data.challenges); // <-- use the challenges array
         }else {
          console.error('❌ Failed to fetch user challenges');
        }
      } catch (err) {
        console.error('Error fetching user challenges:', err);
      }
    };

    fetchUserChallenges();
  }, []);

  // Handle dropdown change
  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedChallenge = listOfChallenges.find(c => c._id === selectedId);

    if (selectedChallenge) {
      setFormData({
        ...formData,
        challengeId: selectedChallenge._id || '',
        challengeName: selectedChallenge.title || '',
      });
    }
  };

  // Add challenge
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const userToken = sessionStorage.getItem('userToken');
      if (!userToken) {
        setNotificationState({
          message: 'User not authenticated.',
          type: NotificationTypeEnum.ERROR,
        });
        return;
      }

      const res = await fetch('/api/challenge/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setNotificationState({
          message: data.message || 'Challenge added successfully',
          type: NotificationTypeEnum.SUCCESS,
        });

        // refresh user challenge list
        setUserChallenges(prev => [{ ...formData, status: 'In Progress' }, ...prev]);
      } else {
        setNotificationState({
          message: data.message || 'Error adding challenge',
          type: NotificationTypeEnum.ERROR,
        });
      }
    } catch (err) {
      console.error('🔥 Error submitting challenge:', err);
      setNotificationState({
        message: 'Error adding challenge',
        type: NotificationTypeEnum.ERROR,
      });
    }
  };

  // Delete challenge
// inside ChallengeAddForm
   const handleDelete = async (challengeId: string) => {
   try {
      const userToken = sessionStorage.getItem('userToken');
      if (!userToken) return;

      const res = await fetch("/api/challenge/delete", {
         method: "DELETE",
         headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${userToken}`,
         },
         body: JSON.stringify({ challengeId }),
      });

      const data = await res.json();

      if (res.ok) {
         setNotificationState({
         message: data.message || "Challenge deleted successfully",
         type: NotificationTypeEnum.SUCCESS,
         });

         setUserChallenges(prev => prev.filter(c => c.challengeId !== challengeId));
      } else {
         setNotificationState({
         message: data.message || "Error deleting challenge",
         type: NotificationTypeEnum.ERROR,
         });
      }
   } catch (err) {
      console.error("🔥 Error deleting challenge:", err);
      setNotificationState({
         message: "Error deleting challenge",
         type: NotificationTypeEnum.ERROR,
      });
   }
   };


  return (
    <div className={styles.formContainer}>
      <Notification
        message={notificationState.message}
        type={notificationState.type}
        onClose={() => setNotificationState({ message: '', type: null })}
      />

      <h3>Add New Challenge</h3>

      <form onSubmit={handleSubmit}>
        {/* Start Date */}
        <div className={styles.inputLabel} style={{ marginBottom: '16px' }}>
          <InputLabel
            labelProps={{ text: 'Challenge Start Date' }}
            inputProps={{
              type: 'date',
              name: 'startDate',
              value: formData.startDate,
              required: true,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, startDate: e.target.value })),
              onClick: (e: React.MouseEvent<HTMLInputElement>) => {
                const input = e.target as HTMLInputElement;
                input.showPicker();
              },
            }}
            icon={<Calendar />}
          />
        </div>

        {/* Challenge Dropdown */}
        <div className={styles.inputLabel}>
          <SubDetails
            details={{
              label: 'Challenge Name',
              subLabel: 'Select a challenge from the dropdown',
              icon: <CreditCard stroke="#06B6D4" />,
            }}
          />
          <Dropdown
            label=""
            name="challengeId"
            value={formData.challengeId}
            onChange={handleDropdownChange}
            options={listOfChallenges.map(c => ({
              label: c.title || 'Untitled',
              value: c._id || '',
            }))}
            icon={<SlimArrowRight />}
          />
        </div>

        {/* Toggle Tracking */}
        <div className={styles.toggleWrapper}>
          <div className={styles.headingWithIcon}>
            <Target stroke="#06B6D4" />
            <h3>Enable Tracking Challenge</h3>
          </div>
          {formData.trackAllowed ? (
            <ToggleRight onClick={() => setFormData(prev => ({ ...prev, trackAllowed: false }))} />
          ) : (
            <ToggleLeft
              className={styles.toggleLeft}
              onClick={() => setFormData(prev => ({ ...prev, trackAllowed: true }))}
            />
          )}
        </div>

        <Button variant="primary" type="submit" classNameProps={styles.button}>
          Save Challenge
        </Button>
      </form>

{/* User Challenges Table */}
<h3 className={styles.sectionHeader}>Your Saved Challenges</h3>
<div className={styles.tableWrapper}>
  <table className={styles.niceTable}>
  <thead>
    <tr>
      <th>Challenge Name</th>
      <th>Start Date</th>
      <th>Tracking</th>
      <th>Status</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    {userChallenges.length > 0 ? (
      userChallenges.map(ch => (
        <tr key={ch.challengeId}>
          <td>{ch.challengeName}</td>
          <td>{ch.startDate}</td>
          <td>
            <span className={ch.trackAllowed ? styles.yesBadge : styles.noBadge}>
              {ch.trackAllowed ? 'Yes' : 'No'}
            </span>
          </td>
          <td>{ch.status}</td>
          <td className={styles.actionCell}>
            <Button
              variant="secondary"
              classNameProps={styles.button}
              onClick={() => handleDelete(ch.challengeId)}
            >
              Delete
            </Button>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={5} className={styles.emptyRow}>
          No challenges added yet.
        </td>
      </tr>
    )}
  </tbody>
</table>
</div>
</div>
  );
}
