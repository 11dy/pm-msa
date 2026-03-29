// k6/03-document-list.js — 문서 목록 + 추천 질문 조회 부하테스트
// 실행: k6 run k6/03-document-list.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL, authHeaders } from './config.js';
import { setupAuth } from './helpers.js';

// 테스트할 프로젝트 ID (환경변수 또는 기본값)
const PROJECT_ID = __ENV.PROJECT_ID || '1';

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '1m',  target: 20 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{name:documents}': ['p(95)<500'],
    'http_req_duration{name:suggestions}': ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  return setupAuth();
}

export default function (data) {
  if (!data.token) return;
  const params = authHeaders(data.token);

  group('프로젝트 문서 조회', function () {
    // 1) 문서 목록
    const docRes = http.get(
      `${BASE_URL}/api/documents?projectId=${PROJECT_ID}`,
      Object.assign({ tags: { name: 'documents' } }, params),
    );
    check(docRes, { 'documents 200': (r) => r.status === 200 });

    sleep(0.3);

    // 2) 추천 질문
    const sugRes = http.get(
      `${BASE_URL}/api/documents/suggestions?projectId=${PROJECT_ID}`,
      Object.assign({ tags: { name: 'suggestions' } }, params),
    );
    check(sugRes, { 'suggestions 200': (r) => r.status === 200 });
  });

  sleep(1);
}
