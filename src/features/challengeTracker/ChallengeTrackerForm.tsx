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

interface KmEntry {
  date: string;
  type: 'Walk' | 'Cycle';
  km: number;
}

export default function ChallengeTracker() {
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [kmEntries, setKmEntries] = useState<KmEntry[]>([]);
  const [formData, setFormData] = useState<KmEntry>({ date: '', type: 'Walk', km: 0 });

  // Fetch user challenges
  useEffect(() => {
    const fetchUserChallenges = async () => {
      try {
        const userToken = sessionStorage.getItem('userToken');
        if (!userToken) return;

        const res = await fetch("/api/challenge/get", {
          method: "GET",
          headers: { "Authorization": `Bearer ${userToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUserChallenges(data.challenges);
        }
      } catch (err) {
        console.error("Error fetching challenges:", err);
      }
    };

    fetchUserChallenges();
  }, []);

  // --- METRICS ---
  const inProgressCount = userChallenges.filter(c => c.status === "In Progress").length;
  const completedCount = userChallenges.filter(c => c.status === "Completed").length;
  const kmWalked = kmEntries.filter(e => e.type === 'Walk').reduce((sum, e) => sum + e.km, 0);
  const kmCycled = kmEntries.filter(e => e.type === 'Cycle').reduce((sum, e) => sum + e.km, 0);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || formData.km <= 0) return;

    setKmEntries(prev => [...prev, formData]);
    setFormData({ date: '', type: 'Walk', km: 0 });
  };

  const handleDeleteEntry = (index: number) => {
    setKmEntries(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.header}>Challenge Dashboard</h2>

      {/* Stat Boxes (kept original CSS) */}
      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <h3>{inProgressCount}</h3>
          <p>Challenges In Progress</p>
        </div>

        <div className={styles.statBox}>
          <h3>{completedCount}</h3>
          <p>Challenges Completed</p>
        </div>

        <div className={styles.statBox}>
          <h3>{kmWalked} km</h3>
          <p>KM Walked</p>
        </div>

        <div className={styles.statBox}>
          <h3>{kmCycled} km</h3>
          <p>KM Cycled</p>
        </div>
      </div>

      {/* KM Tracking Form */}
      <h3 className={styles.sectionHeader}>Add KM Entry</h3>
      <form className={styles.kmForm} onSubmit={handleAddEntry}>
        <div className={styles.kmFormGrid}>
          <div className={styles.inputGroup}>
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Type</label>
            <select
              value={formData.type}
              onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as 'Walk' | 'Cycle' }))}
              className={styles.inputField}
            >
              <option value="Walk">Walk</option>
              <option value="Cycle">Cycle</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>KM</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={formData.km}
              onChange={e => setFormData(prev => ({ ...prev, km: parseFloat(e.target.value) }))}
              required
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroupButton}>
            <button type="submit" className={styles.addButton}>Add Entry</button>
          </div>
        </div>
      </form>

      {/* Past KM Entries Table */}
      <h3 className={styles.sectionHeader}>Past KM Entries</h3>
      {kmEntries.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.niceTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>KM</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {kmEntries.map((e, i) => (
                <tr key={i}>
                  <td>{e.date}</td>
                  <td>{e.type}</td>
                  <td>{e.km}</td>
                  <td>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteEntry(i)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.emptyMessage}>No KM entries added yet.</p>
      )}
    </div>
  );
}
