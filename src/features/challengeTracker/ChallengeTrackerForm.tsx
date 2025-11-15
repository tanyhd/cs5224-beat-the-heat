'use client';

import React, { useEffect, useState } from 'react';
import styles from './ChallengeTrackerForm.module.css';

interface UserChallenge {
  challengeId: string;
  challengeName: string;
  startDate: string;
  trackAllowed: boolean;
  status?: string;
}

interface KMEntry {
  _id?: string;
  date: string;
  type: 'Walk' | 'Cycle';
  km: number;
  challengeId?: string;
}

// Spinner component
const Spinner = () => (
  <div className={styles.spinner}></div>
);

export default function ChallengeTracker() {
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [kmEntries, setKmEntries] = useState<KMEntry[]>([]);
  const [formData, setFormData] = useState<{
    date: string;
    type: 'Walk' | 'Cycle';
    km: string;
    challengeId?: string;
  }>({
    date: '',
    type: 'Walk',
    km: '',
    challengeId: '',
  });

  // Loading states
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [loadingChallenges, setLoadingChallenges] = useState<boolean>(true);
  const [loadingKMEntries, setLoadingKMEntries] = useState<boolean>(true);

  // --- Fetch user challenges ---
  useEffect(() => {
    const fetchUserChallenges = async () => {
      const userToken = sessionStorage.getItem('userToken');
      if (!userToken) return;
      try {
        const res = await fetch('/api/challenge/get', {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserChallenges(data.challenges || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingChallenges(false);
        setLoadingStats(false);
      }
    };
    fetchUserChallenges();
  }, []);

  // --- Fetch KM entries ---
  useEffect(() => {
    const fetchKMEntries = async () => {
      const userToken = sessionStorage.getItem('userToken');
      if (!userToken) return;
      try {
        const res = await fetch('/api/challenge/progress/get', {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          const mappedEntries = (data.progress || []).map((entry: any) => ({
            ...entry,
            type: entry.activity,
          }));
          setKmEntries(mappedEntries);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingKMEntries(false);
      }
    };
    fetchKMEntries();
  }, []);

  // --- Metrics ---
  const inProgressCount = userChallenges.filter(c => c.status === 'In Progress').length;
  const completedCount = userChallenges.filter(c => c.status === 'Completed').length;
  const kmWalked = kmEntries.filter(e => e.type === 'Walk').reduce((sum, e) => sum + e.km, 0);
  const kmCycled = kmEntries.filter(e => e.type === 'Cycle').reduce((sum, e) => sum + e.km, 0);

  // --- Submit KM Entry ---
  const handleKMSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const userToken = sessionStorage.getItem('userToken');
    if (!userToken) return;

    const kmValue = parseFloat(formData.km);
    if (isNaN(kmValue)) return;

    const payload = {
      challengeId: formData.challengeId || '',
      date: formData.date,
      activity: formData.type,
      km: kmValue,
    };

    try {
      const res = await fetch('/api/challenge/progress/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setKmEntries(prev => [
          ...prev,
          { ...formData, km: kmValue, challengeId: formData.challengeId || undefined },
        ]);
        setFormData({ date: '', type: 'Walk', km: '', challengeId: '' });
      } else {
        console.error('Error adding KM entry:', data.message);
      }
    } catch (err) {
      console.error('Error adding KM entry:', err);
    }
  };

  // --- Delete KM Entry ---
  const handleDeleteKM = async (entryId?: string) => {
    if (!entryId) return;
    const userToken = sessionStorage.getItem('userToken');
    if (!userToken) return;

    try {
      const res = await fetch('/api/challenge/progress/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ entryId }),
      });

      const data = await res.json();
      if (res.ok) setKmEntries(prev => prev.filter(e => e._id !== entryId));
      else console.error('Error deleting KM entry:', data.message);
    } catch (err) {
      console.error('Error deleting KM entry:', err);
    }
  };

  // --- Complete Challenge ---
  const handleCompleteChallenge = async (challengeId: string) => {
    const userToken = sessionStorage.getItem('userToken');
    if (!userToken) return;
    try {
      const res = await fetch('/api/challenge/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ challengeId }),
      });
      if (res.ok) {
        setUserChallenges(prev =>
          prev.map(c => (c.challengeId === challengeId ? { ...c, status: 'Completed' } : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.header}>Challenge Dashboard</h2>

      {/* Stats Boxes */}
      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <h3>{loadingStats ? <Spinner /> : inProgressCount}</h3>
          <p>Challenges In Progress</p>
        </div>
        <div className={styles.statBox}>
          <h3>{loadingStats ? <Spinner /> : completedCount}</h3>
          <p>Challenges Completed</p>
        </div>
        <div className={styles.statBox}>
          <h3>{loadingStats ? <Spinner /> : `${kmWalked} km`}</h3>
          <p>KM Walked</p>
        </div>
        <div className={styles.statBox}>
          <h3>{loadingStats ? <Spinner /> : `${kmCycled} km`}</h3>
          <p>KM Cycled</p>
        </div>
      </div>

      {/* KM Form */}
      <h3 className={styles.sectionHeader}>Add KM Entry</h3>
      <form className={styles.kmForm} onSubmit={handleKMSubmit}>
        <div className={styles.kmFormGrid}>
          <div className={styles.inputGroup}>
            <label>Date</label>
            <input
              type="date"
              className={styles.inputField}
              value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Type</label>
            <select
              className={styles.inputField}
              value={formData.type}
              onChange={e =>
                setFormData(prev => ({ ...prev, type: e.target.value as 'Walk' | 'Cycle' }))
              }
            >
              <option value="Walk">Walk</option>
              <option value="Cycle">Cycle</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>KM</label>
            <input
              type="number"
              className={styles.inputField}
              value={formData.km}
              onChange={e => setFormData(prev => ({ ...prev, km: e.target.value }))}
              required
              min={0}
              step={0.1}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Challenge (optional)</label>
            <select
              className={styles.inputField}
              value={formData.challengeId}
              onChange={e => setFormData(prev => ({ ...prev, challengeId: e.target.value }))}
            >
              <option value="">None</option>
              {userChallenges
                .filter(c => c.status === 'In Progress')
                .map(c => (
                  <option key={c.challengeId} value={c.challengeId}>
                    {c.challengeName}
                  </option>
                ))}
            </select>
          </div>
          <div className={styles.inputGroupButton}>
            <button type="submit" className={styles.addButton}>
              Add
            </button>
          </div>
        </div>
      </form>

      {/* KM Entries Table */}
      <h3 className={styles.sectionHeader}>Your KM Entries</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.niceTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>KM</th>
              <th>Linked Challenge</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loadingKMEntries ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  <Spinner />
                </td>
              </tr>
            ) : kmEntries.length ? (
              kmEntries.map((entry, idx) => (
                <tr key={idx}>
                  <td>{entry.date}</td>
                  <td>{entry.type}</td>
                  <td>{entry.km}</td>
                  <td>
                    {userChallenges.find(c => c.challengeId === entry.challengeId)?.challengeName || '-'}
                  </td>
                  <td>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteKM(entry._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  No KM entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Challenges Table */}
      <h3 className={styles.sectionHeader}>Your Challenges</h3>
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
            {loadingChallenges ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  <Spinner />
                </td>
              </tr>
            ) : userChallenges.length ? (
              userChallenges.map(ch => (
                <tr key={ch.challengeId}>
                  <td>{ch.challengeName}</td>
                  <td>{ch.startDate}</td>
                  <td>{ch.trackAllowed ? 'Yes' : 'No'}</td>
                  <td>{ch.status || '-'}</td>
                  <td>
                    {ch.status !== 'Completed' && (
                      <button
                        className={styles.completeButton}
                        onClick={() => handleCompleteChallenge(ch.challengeId)}
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
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
