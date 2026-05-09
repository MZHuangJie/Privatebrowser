import React from 'react';
import { BrowserSettings, PrivacyLevel, SearchEngine, ThemeMode } from '../../shared/types';
interface Props { settings: BrowserSettings; onChange: (p: Partial<BrowserSettings>) => void; onClose: () => void; }
export default function SettingsPanel({settings,onChange,onClose}:Props) {
  return (<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={onClose}>
    <div style={{background:'#1e1e2e',border:'1px solid #45475a',borderRadius:12,width:480,maxHeight:'80vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
      <div style={{display:'flex',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #45475a'}}><h3 style={{fontSize:16}}>设置</h3><button onClick={onClose} style={{background:'none',border:'none',color:'#6c7086',fontSize:20,cursor:'pointer'}}>×</button></div>
      <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={{fontSize:13,fontWeight:600,color:'#a6adc8'}}>隐私级别</label>
          <select value={settings.privacyLevel} onChange={e=>onChange({privacyLevel:e.target.value as PrivacyLevel})} style={{width:'100%',marginTop:8,background:'#313244',border:'1px solid #45475a',borderRadius:6,color:'#cdd6f4',padding:'6px 10px',fontSize:13}}><option value="strict">严格</option><option value="balanced">平衡</option><option value="relaxed">宽松</option></select></div>
        <div><label style={{fontSize:13,fontWeight:600,color:'#a6adc8'}}>主题</label>
          <select value={settings.theme} onChange={e=>onChange({theme:e.target.value as ThemeMode})} style={{width:'100%',marginTop:8,background:'#313244',border:'1px solid #45475a',borderRadius:6,color:'#cdd6f4',padding:'6px 10px',fontSize:13}}><option value="dark">暗色</option><option value="light">亮色</option><option value="system">跟随系统</option></select></div>
        <div><label style={{fontSize:13,fontWeight:600,color:'#a6adc8'}}>搜索引擎</label>
          <select value={settings.searchEngine} onChange={e=>onChange({searchEngine:e.target.value as SearchEngine})} style={{width:'100%',marginTop:8,background:'#313244',border:'1px solid #45475a',borderRadius:6,color:'#cdd6f4',padding:'6px 10px',fontSize:13}}><option value="google">Google</option><option value="duckduckgo">DuckDuckGo</option><option value="bing">Bing</option><option value="baidu">Baidu</option><option value="searxng">SearXNG</option></select></div>
      </div>
    </div>
  </div>);
}
