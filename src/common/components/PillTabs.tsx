import React, { useState } from 'react';
import './PillTabs.css'; // Assuming you have a CSS file for styling
import Walking from '../icons/Walking';
import Cycling from '../icons/Cycling';

type Tab = {
  id: string | number;
  label: string;
  content: React.ReactNode;
};

type PillTabsProps = {
  tabs: Tab[];
  onChange: () => void;
  value?: Tab['id']; // Optional controlled value
};

const ModeIcon = ({ isActive, mode }: { isActive: boolean, mode: "walking" | "bicycling" }) => {
  const strokeColor = isActive ? "white" : "#064E3B";
  return (
    <div>
      {mode === "walking" ? <Walking stroke={strokeColor}/> : <Cycling stroke={strokeColor}/>}
    </div>
  );
};

const PillTabs: React.FC<PillTabsProps> = ({ tabs, onChange, value }) => {
  const [internalActiveTab, setInternalActiveTab] = useState<Tab['id'] | null>(tabs?.[0]?.id ?? null);

  // Use controlled value if provided, otherwise use internal state
  const activeTab = value !== undefined ? value : internalActiveTab;

  const isActive = (tabId: Tab['id']): boolean => {
    return activeTab === tabId;
  };

  return (
    <div className="pill-tabs-container">
      <div className="pill-tab-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`pill-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              // Only update internal state if not controlled
              if (value === undefined) {
                setInternalActiveTab(tab.id);
              }
              onChange();
            }}
            style={{display: 'flex', alignItems: 'center', gap: '8px'}}
          >
            <ModeIcon isActive={isActive(tab.id)} mode={tab.label === "Walking" ? "walking" : "bicycling"} />
            <span className="pill-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PillTabs;