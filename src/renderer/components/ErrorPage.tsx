import React from 'react';
interface Props { errorCode: string; errorDescription: string; onRetry: () => void; }
export default function ErrorPage({errorCode,errorDescription,onRetry}:Props) {
  return (<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,color:'#cdd6f4'}}><div style={{fontSize:48}}>⚠️</div><h2 style={{fontSize:20}}>{errorCode}</h2><p style={{fontSize:14,color:'#a6adc8'}}>{errorDescription}</p><button onClick={onRetry} style={{padding:'8px 24px',background:'#89b4fa',border:'none',borderRadius:6,color:'white',fontSize:14,cursor:'pointer'}}>重试</button></div>);
}
