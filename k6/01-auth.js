// k6/01-auth.js — 인증 API 부하테스트
// 실행: k6 run k6/01-auth.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_USER, jsonHeaders } from './config.js';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '30s', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{name:login}': ['p(95)<500'],
    'http_req_duration{name:refresh}': ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // 1) 로그인
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password }),
    Object.assign({ tags: { name: 'login' } }, jsonHeaders()),
  );
  check(loginRes, {
    'login 200': (r) => r.status === 200,
    'has accessToken': (r) => {
      const body = r.json();
      return !!(body.data?.accessToken || body.accessToken);
    },
  });

  if (loginRes.status !== 200) {
    sleep(1);
    return;
  }

  const body = loginRes.json();
  const accessToken = body.data?.accessToken || body.accessToken;
  const refreshToken = body.data?.refreshToken || body.refreshToken;

  sleep(0.5);

  // 2) 토큰 갱신
  if (refreshToken) {
    const refreshRes = http.post(
      `${BASE_URL}/api/auth/refresh`,
      JSON.stringify({ refreshToken }),
      Object.assign({ tags: { name: 'refresh' } }, jsonHeaders()),
    );
    check(refreshRes, {
      'refresh 200': (r) => r.status === 200,
    });
  }

  // 3) 토큰 검증
  const validateRes = http.get(`${BASE_URL}/api/auth/validate`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
    tags: { name: 'validate' },
  });
  check(validateRes, {
    'validate 200': (r) => r.status === 200,
  });

  sleep(1);
}
