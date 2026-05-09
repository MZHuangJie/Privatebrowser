import React from 'react';
import { PrivacyLevel, SearchEngine, SEARCH_ENGINES } from '../../shared/types';
import './StatusBar.css';

interface Props {
  privacyLevel: PrivacyLevel;
  searchEngine: SearchEngine;
  isHttps: boolean;
}

const LEVEL_LABEL: Record<PrivacyLevel, string> = {
  strict: '🛡️ 严格',
  balanced: '🛡️ 平衡',
  relaxed: '🛡️ 宽松',
};

export default function StatusBar({ privacyLevel, searchEngine, isHttps }: Props) {
  return (
    <div className="status-bar">
      <span>{LEVEL_LABEL[privacyLevel]}</span>
      <span>{SEARCH_ENGINES[searchEngine].name} · {isHttps ? 'HTTPS' : 'HTTP'}</span>
    </div>
  );
}
