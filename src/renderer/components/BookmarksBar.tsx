import React from 'react';
import { Bookmark } from './BookmarkEditDialog';
import './BookmarksBar.css';

interface Props {
  bookmarks: Bookmark[];
  onNavigate: (url: string) => void;
}

export default function BookmarksBar({ bookmarks, onNavigate }: Props) {
  const visible = bookmarks.filter((b) => b.showInBar);
  if (visible.length === 0) return null;

  const byFolder = new Map<string, Bookmark[]>();
  for (const b of visible) {
    const key = b.folder || '__root__';
    if (!byFolder.has(key)) byFolder.set(key, []);
    byFolder.get(key)!.push(b);
  }

  return (
    <div className="bookmarks-bar">
      {Array.from(byFolder.entries()).map(([folder, items]) => (
        <div key={folder} className="bookmarks-bar-group">
          {folder !== '__root__' && <span className="bookmarks-bar-folder">{folder}</span>}
          {items.map((b) => (
            <button
              key={b.url}
              className="bookmarks-bar-item"
              onClick={() => onNavigate(b.url)}
              title={b.url}
            >{b.title}</button>
          ))}
        </div>
      ))}
    </div>
  );
}
