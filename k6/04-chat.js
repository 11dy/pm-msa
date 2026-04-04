// k6/04-chat.js — AI 채팅 부하테스트
// 실행: k6 run k6/04-chat.js
//
// 주의: LLM + RAG 파이프라인은 무거우므로 VU를 낮게 시작
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, authHeaders } from './config.js';
import { setupAuth } from './helpers.js';

const PROJECT_ID = __ENV.PROJECT_ID || '1';

const QUESTIONS = [
  '이 프로젝트의 핵심 내용을 요약해줘',
  '주요 일정은 어떻게 되나요?',
  '담당자가 누구인지 알려줘',
  '문서에서 언급된 리스크 요소가 있나요?',
  '예산 관련 내용을 정리해줘',
];

export const options = {
  stages: [
    { duration: '10s', target: 3 },   // 천천히 증가
    { duration: '1m',  target: 5 },   // 5 VU 유지 (LLM 병목)
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{name:chat}': ['p(95)<30000'],  // LLM 응답 30초
    http_req_failed: ['rate<0.1'],
  },
};

export function setup() {
  return setupAuth();
}

export default function (data) {
  if (!data.token) return;
  const params = authHeaders(data.token);

  // 랜덤 질문 선택
  const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

  // 채팅 (non-streaming — k6는 SSE 네이티브 미지원이므로 stream=false)
  const res = http.post(
    `${BASE_URL}/agent/chat/message`,
    JSON.stringify({
      question,
      user_id: 1,
      project_id: parseInt(PROJECT_ID),
      stream: false,
    }),
    Object.assign({ tags: { name: 'chat' }, timeout: '60s' }, params),
  );

  check(res, {
    'chat 200': (r) => r.status === 200,
    'has answer': (r) => {
      try {
        const body = r.json();
        return !!(body.answer || body.data?.answer);
      } catch (e) {
        return r.body && r.body.length > 0;
      }
    },
  });

  sleep(3); // 사용자가 응답 읽는 시간
}
