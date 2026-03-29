// k6/config.js — 공통 설정
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// 테스트용 계정 (사전에 회원가입 필요)
// ex) 환경변수로 전달: k6 run -e TEST_EMAIL=you@test.com -e TEST_PASSWORD=yourpass k6/01-auth.js
export const TEST_USER = {
  email: __ENV.TEST_EMAIL || '<your-email>',
  password: __ENV.TEST_PASSWORD || '<your-password>',
};

// 공통 헤더
export function authHeaders(token) {
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

export function jsonHeaders() {
  return {
    headers: { 'Content-Type': 'application/json' },
  };
}
