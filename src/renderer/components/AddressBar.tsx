import React, { useState, useRef, useEffect } from 'react';
import './AddressBar.css';

interface Props {
  url: string;
  isLoading: boolean;
  blockedCount: number;
  onNavigate: (url: string) => void;
}

export default function AddressBar({ url, isLoading, blockedCount, onNavigate }: Props) {
  const [value, setValue] = useState(url);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setValue(url); }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onNavigate(trimmed);
    inputRef.current?.blur();
  };

  const isHttps = url.startsWith('https://');

  return (
    <div className="address-bar">
      <form className="address-form" onSubmit={handleSubmit}>
        <span className="address-lock">{isHttps ? '🔒' : '⚠️'}</span>
        <input
          ref={inputRef}
          className="address-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="Search or enter URL"
          spellCheck={false}
        />
        {isLoading && <span className="address-spinner">⟳</span>}
        {blockedCount > 0 && (
          <span className="address-blocked">已拦截 {blockedCount}</span>
        )}
      </form>
    </div>
  );
}
