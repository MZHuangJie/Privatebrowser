import React from 'react';
import { TabState } from '../../shared/types';
interface Props { tabs: TabState[]; activeTabId: string | null; onSwitch: (id: string) => void; onClose: (id: string) => void; onCreate: () => void; onPin: (id: string) => void; }
export default function TabBar({ tabs, activeTabId, onSwitch, onClose, onCreate, onPin }: Props) {
  return (<div style={{display:'flex',background:'#181825',padding:'4px 8px',gap:2,alignItems:'center'}}>
    {tabs.map(t => (<div key={t.id} onClick={()=>onSwitch(t.id)} onAuxClick={e=>{if(e.button===1)onClose(t.id)}} style={{padding:'6px 28px 6px 12px',background:t.id===activeTabId?'#1e1e2e':'#313244',borderRadius:'6px 6px 0 0',fontSize:12,color:t.id===activeTabId?'#cdd6f4':'#a6adc8',cursor:'pointer',position:'relative',whiteSpace:'nowrap'}}>{t.title.slice(0,30)}{!t.isPinned&&<span onClick={e=>{e.stopPropagation();onClose(t.id)}} style={{position:'absolute',right:6,top:4,fontSize:10,color:'#6c7086'}}>×</span>}</div>))}
    <button onClick={()=>onCreate()} style={{background:'none',border:'none',color:'#6c7086',fontSize:18,cursor:'pointer'}}>+</button>
  </div>);
}
