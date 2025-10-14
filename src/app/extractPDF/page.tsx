'use client';

import { useState } from 'react';

export default function ExtractPDFPage() {
  const [result, setResult] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'ocbc-credit-card' | 'ocbc-account'>('ocbc-credit-card');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('type', type);

    try {
      const res = await fetch('/api/extractPDF', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setResult(data.rows);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResult([]);
    setType(e.target.value as 'ocbc-credit-card' | 'ocbc-account');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Upload PDF</h1>

      <label>
        Select PDF Type:
        <select
          value={type}
          onChange={handleTypeChange}
          style={{ marginLeft: '1rem' }}
        >
          <option value="ocbc-credit-card">OCBC Credit Card</option>
          <option value="ocbc-account">OCBC Account</option>
        </select>
      </label>
      <br />
      <br />

      <input type="file" accept="application/pdf" onChange={handleFileChange} />

      {loading && <p>Extracting PDF...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          {type === 'ocbc-account' ? (
            <>
              <h2>Transactions</h2>
              <table style={{ borderCollapse: 'collapse', width: '100%' }} border={1}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Cheque</th>
                    <th>Withdrawal</th>
                    <th>Deposit</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.map((row: any, rowIndex: number) => {
                    if (Array.isArray(row)) {
                      return (
                        <tr key={rowIndex}>
                          {row.map((cell: string, cellIndex: number) => (
                            <td key={cellIndex} style={{ padding: '0.5rem' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      );
                    }
                    return null;
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <h2>Transactions</h2>
              <table style={{ borderCollapse: 'collapse', width: '100%' }} border={1}>
                <thead>
                  <tr>
                    <th>Transaction Date</th>
                    <th>Description</th>
                    <th>Amount(SGD)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.map((row: any, rowIndex: number) => {
                    // For OCBC Credit Card, expect each row to be an array of three strings.
                    if (Array.isArray(row) && row.length === 3) {
                      return (
                        <tr key={rowIndex}>
                          {row.map((cell: string, cellIndex: number) => (
                            <td key={cellIndex} style={{ padding: '0.5rem' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      );
                    }
                    return null;
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}