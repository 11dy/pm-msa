// k6/05-user-flow.js — 실제 사용자 플로우 시뮬레이션
// 실행: k6 run k6/05-user-flow.js
//
// 시나리오: 로그인 → 프로젝트 목록 → 문서 목록 → 추천 질문 → 채팅
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL, TEST_USER, jsonHeaders, authHeaders } from './config.js';

export const options = {
  scenarios: {
    user_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 5 },
        { duration: '1m',  target: 5 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<10000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  let token;

  // Step 1: 로그인
  group('01_login', function () {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password }),
      jsonHeaders(),
    );
    const ok = check(res, { 'login ok': (r) => r.status === 200 });
    if (ok) {
      const body = res.json();
      token = body.data?.accessToken || body.accessToken;
    }
  });

  if (!token) {
    sleep(2);
    return;
  }

  const params = authHeaders(token);
  sleep(1);

  // Step 2: 프로젝트 목록
  let projectId;
  group('02_projects', function () {
    const res = http.get(`${BASE_URL}/api/project`, params);
    check(res, { 'projects ok': (r) => r.status === 200 });

    if (res.status === 200) {
      try {
        const body = res.json();
        const projects = body.data || body;
        if (Array.isArray(projects) && projects.length > 0) {
          projectId = projects[0].id;
        }
      } catch (e) { /* ignore */ }
    }
  });

  if (!projectId) {
    sleep(2);
    return;
  }

  sleep(0.5);

  // Step 3: 문서 목록 + 추천 질문 (병렬 요청 시뮬레이션)
  group('03_project_detail', function () {
    const docRes = http.get(`${BASE_URL}/api/documents?projectId=${projectId}`, params);
    check(docRes, { 'documents ok': (r) => r.status === 200 });

    const sugRes = http.get(`${BASE_URL}/api/documents/suggestions?projectId=${projectId}`, params);
    check(sugRes, { 'suggestions ok': (r) => r.status === 200 });
  });

  sleep(1);

  // Step 4: AI 채팅
  group('04_chat', function () {
    const res = http.post(
      `${BASE_URL}/api/chat/message`,
      JSON.stringify({
        question: '이 프로젝트의 핵심 내용을 요약해줘',
        user_id: 1,
        project_id: projectId,
        stream: false,
      }),
      Object.assign({ timeout: '60s' }, params),
    );
    check(res, { 'chat ok': (r) => r.status === 200 });
  });

  sleep(2);
}
