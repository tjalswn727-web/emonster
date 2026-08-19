import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

// Firebase 클라이언트 설정값 — apiKey 등은 "비밀키"가 아니라 프로젝트를 식별하는 공개 식별자예요.
// 실제 접근 제어는 Firestore 보안 규칙(교실 코드 기반)이 담당하므로 그대로 커밋해도 안전해요.
const firebaseConfig = {
  apiKey: 'AIzaSyCG2v5U1A4i7ZwvxGE2TobEtVVysELVeQ0',
  authDomain: 'emonster-3cff7.firebaseapp.com',
  projectId: 'emonster-3cff7',
  storageBucket: 'emonster-3cff7.firebasestorage.app',
  messagingSenderId: '1003493477251',
  appId: '1:1003493477251:web:c4998e7e89d46c7106c4b6',
};

export const firebaseApp = initializeApp(firebaseConfig);
// 일부 학교/기관 네트워크는 Firestore의 기본 스트리밍 연결(WebChannel)을 프록시가 막는 경우가 있어,
// 자동으로 감지해서 필요하면 일반 HTTP 롱폴링으로 전환하도록 한다.
export const db = initializeFirestore(firebaseApp, { experimentalAutoDetectLongPolling: true });
