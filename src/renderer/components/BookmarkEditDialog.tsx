import React, { useState } from 'react';
import './BookmarkEditDialog.css';

export interface Bookmark {
  title: string;
  url: string;
  folder: string;
  showInBar: boolean;
}

interface Props {
  title: string;
  url: string;
  folders: string[];
  initialFolder: string;
  initialShowInBar: boolean;
  onSave: (bookmark: Bookmark) => void;
  onRemove: () => void;
  onClose: () => void;
  isExisting: boolean;
}

export default function BookmarkEditDialog({
  title: initialTitle, url, folders, initialFolder,
  initialShowInBar, onSave, onRemove, onClose, isExisting,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [folder, setFolder] = useState(initialFolder);
  const [showInBar, setShowInBar] = useState(initialShowInBar);
  const [newFolder, setNewFolder] = useState('');

  const allFolders = [...folders, ...(newFolder ? [newFolder] : [])];

  const handleSave = () => {
    onSave({ title: title.trim() || url, url, folder: folder || newFolder || '', showInBar });
    onClose();
  };

  return (
    <div className="bookmark-edit-overlay" onClick={onClose}>
      <div className="bookmark-edit-panel" onClick={(e) => e.stopPropagation()}>
        <div className="bookmark-edit-header">
          <h3>{isExisting ? '编辑收藏' : '添加收藏'}</h3>
          <button className="bookmark-edit-close" onClick={onClose}>×</button>
        </div>
        <div className="bookmark-edit-body">
          <div className="bookmark-edit-field">
            <label>标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="收藏名称"
              autoFocus
            />
          </div>
          <div className="bookmark-edit-field">
            <label>网址</label>
            <input value={url} disabled className="url-disabled" />
          </div>
          <div className="bookmark-edit-field">
            <label>目录</label>
            <div className="folder-row">
              <select value={folder} onChange={(e) => setFolder(e.target.value)}>
                <option value="">无目录</option>
                {allFolders.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <input
                value={newFolder}
                onChange={(e) => { setNewFolder(e.target.value); setFolder(''); }}
                placeholder="新建目录..."
              />
            </div>
          </div>
          <div className="bookmark-edit-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showInBar}
                onChange={(e) => setShowInBar(e.target.checked)}
              />
              <span>在地址栏下方显示</span>
            </label>
          </div>
        </div>
        <div className="bookmark-edit-footer">
          {isExisting && (
            <button className="bookmark-edit-remove" onClick={onRemove}>删除收藏</button>
          )}
          <div className="bookmark-edit-actions">
            <button className="bookmark-edit-cancel" onClick={onClose}>取消</button>
            <button className="bookmark-edit-save" onClick={handleSave}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}
