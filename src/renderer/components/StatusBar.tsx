import React from 'react';
import { PrivacyLevel, SearchEngine } from '../../shared/types';
interface Props { privacyLevel: PrivacyLevel; searchEngine: SearchEngine; isHttps: boolean; }
const L:Record<PrivacyLevel,string>={strict:'🛡️ 严格',balanced:'🛡️ 平衡',relaxed:'🛡️ 宽松'};
export default function StatusBar({privacyLevel,searchEngine,isHttps}:Props) {
  return (<div style={{display:'flex',justifyContent:'space-between',padding:'2px 12px',background:'#181825',fontSize:11,color:'#6c7086'}}><span>{L[privacyLevel]}</span><span>{searchEngine} · {isHttps?'HTTPS':'HTTP'}</span></div>);
}
