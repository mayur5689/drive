import { Slot } from 'expo-router';

export default function AuthLayout() {
  // #region agent log
  fetch('http://127.0.0.1:7249/ingest/78023b60-deb9-40e8-b555-1d434a8d2d9b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(auth)/_layout.tsx:5',message:'AuthLayout rendering with Slot',data:{usingSlot:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  return <Slot />;
}

