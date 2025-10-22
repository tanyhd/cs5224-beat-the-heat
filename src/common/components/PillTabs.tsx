import React, { useState } from 'react';
import './PillTabs.css'; // Assuming you have a CSS file for styling

type Tab = {
  id: string | number;
  label: string;
  content: React.ReactNode;
};

type PillTabsProps = {
  tabs: Tab[];
  onChange: () => void;
};

const PillTabs: React.FC<PillTabsProps> = ({ tabs, onChange }) => {
  const [activeTab, setActiveTab] = useState<Tab['id'] | null>(tabs?.[0]?.id ?? null);

  return (
    <div className="pill-tabs-container">
      <div className="pill-tab-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`pill-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id)
              onChange();
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PillTabs;