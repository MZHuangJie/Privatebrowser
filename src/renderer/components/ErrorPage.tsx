import React from 'react';
import './ErrorPage.css';

interface Props {
  errorCode: string;
  errorDescription: string;
  onRetry: () => void;
}

export default function ErrorPage({ errorCode, errorDescription, onRetry }: Props) {
  return (
    <div className="error-page">
      <div className="error-icon">⚠️</div>
      <h2 className="error-code">{errorCode}</h2>
      <p className="error-desc">{errorDescription}</p>
      <button className="error-retry" onClick={onRetry}>重试</button>
    </div>
  );
}
