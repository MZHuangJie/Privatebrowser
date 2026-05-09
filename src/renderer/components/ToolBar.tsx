import React from 'react';
interface Props { canGoBack: boolean; canGoForward: boolean; onBack: () => void; onForward: () => void; onReload: () => void; theme: 'dark'|'light'; onToggleTheme: () => void; onOpenSettings: () => void; }
const btn = {width:32,height:28,background:'#313244',border:'none' as const,borderRadius:4,color:'#cdd6f4',fontSize:14,cursor:'pointer' as const};
export default function ToolBar(p: Props) {
  return (<div style={{display:'flex',alignItems:'center',padding:'4px 8px',background:'#181825',gap:8}}>
    <div style={{display:'flex',gap:4}}><button style={btn} onClick={p.onBack} disabled={!p.canGoBack}>←</button><button style={btn} onClick={p.onForward} disabled={!p.canGoForward}>→</button><button style={btn} onClick={p.onReload}>↻</button></div>
    <div style={{flex:1,textAlign:'center',fontSize:12,color:'#6c7086',fontWeight:600}}>PrivBrowser</div>
    <div style={{display:'flex',gap:4}}><button style={btn} onClick={p.onToggleTheme}>{p.theme==='dark'?'☀️':'🌙'}</button><button style={btn} onClick={p.onOpenSettings}>⚙</button></div>
  </div>);
}
