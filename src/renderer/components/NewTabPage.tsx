import React, { useState } from 'react';
import './NewTabPage.css';

interface Props {
  onNavigate: (url: string) => void;
  searchEngine: string;
}

export default function NewTabPage({ onNavigate, searchEngine }: Props) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onNavigate(trimmed);
  };

  return (
    <div className="newtab">
      <div className="newtab-content">
        <div className="newtab-logo">🛡️</div>
        <h1 className="newtab-title">PrivBrowser</h1>
        <p className="newtab-subtitle">隐私优先，安全浏览</p>
        <form className="newtab-search-wrapper" onSubmit={handleSubmit}>
          <input
            className="newtab-search"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="搜索网页或输入网址"
            autoFocus
            spellCheck={false}
          />
          <span className="newtab-search-icon">🔍</span>
        </form>
        <span className="newtab-engine">{searchEngine}</span>
      </div>
    </div>
  );
}
