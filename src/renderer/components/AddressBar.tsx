import React, { useState, useRef, useEffect } from 'react';
interface Props { url: string; isLoading: boolean; blockedCount: number; onNavigate: (url: string) => void; }
export default function AddressBar({ url, isLoading, blockedCount, onNavigate }: Props) {
  const [value, setValue] = useState(url); const ref = useRef<HTMLInputElement>(null);
  useEffect(()=>{setValue(url)},[url]);
  const submit = (e: React.FormEvent) => { e.preventDefault(); const t = value.trim(); if(t) onNavigate(t); ref.current?.blur(); };
  return (<div style={{padding:'6px 10px',background:'#181825'}}><form onSubmit={submit} style={{display:'flex',alignItems:'center',background:'#313244',borderRadius:20,padding:'4px 14px',gap:8}}>
    <span style={{fontSize:12}}>{url.startsWith('https://')?'🔒':'⚠️'}</span>
    <input ref={ref} style={{flex:1,background:'none',border:'none',color:'#cdd6f4',fontSize:13,outline:'none'}} value={value} onChange={e=>setValue(e.target.value)} onFocus={e=>e.target.select()} placeholder="Search or enter URL" spellCheck={false} />
    {isLoading&&<span>⟳</span>}
    {blockedCount>0&&<span style={{background:'#a6e3a1',color:'#1e1e2e',borderRadius:10,padding:'1px 8px',fontSize:10,fontWeight:600}}>{blockedCount}</span>}
  </form></div>);
}
