import React from 'react';
import { Bookmark } from './BookmarkEditDialog';
import './BookmarksPanel.css';

interface Props {
  bookmarks: Bookmark[];
  onNavigate: (url: string) => void;
  onRemove: (url: string) => void;
  onClose: () => void;
}

export default function BookmarksPanel({ bookmarks, onNavigate, onRemove, onClose }: Props) {
  const grouped = new Map<string, Bookmark[]>();
  for (const b of bookmarks) {
    const key = b.folder || '__root__';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(b);
  }

  return (
    <div className="bookmarks-overlay" onClick={onClose}>
      <div className="bookmarks-panel" onClick={(e) => e.stopPropagation()}>
        <div className="bookmarks-header">
          <h3>收藏夹</h3>
          <button className="bookmarks-close" onClick={onClose}>×</button>
        </div>
        <div className="bookmarks-body">
          {bookmarks.length === 0 ? (
            <p className="bookmarks-empty">暂无收藏</p>
          ) : (
            Array.from(grouped.entries()).map(([folder, items]) => (
              <div key={folder}>
                {folder !== '__root__' && <div className="bookmark-folder-label">{folder}</div>}
                {items.map((b) => (
                  <div key={b.url} className="bookmark-item">
                    <div className="bookmark-info" onClick={() => onNavigate(b.url)}>
                      <span className="bookmark-icon">{b.showInBar ? '📌' : '🔖'}</span>
                      <div className="bookmark-text">
                        <span className="bookmark-title">{b.title}</span>
                        <span className="bookmark-url">{b.url}</span>
                      </div>
                    </div>
                    <button
                      className="bookmark-remove"
                      onClick={(e) => { e.stopPropagation(); onRemove(b.url); }}
                      title="删除"
                    >×</button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
