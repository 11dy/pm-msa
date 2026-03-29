// k6/helpers.js — 로그인 + 토큰 획득 헬퍼
import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, TEST_USER, jsonHeaders } from './config.js';

// 로그인하여 accessToken 반환
export function login(email, password) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: email || TEST_USER.email, password: password || TEST_USER.password }),
    jsonHeaders(),
  );
  const ok = check(res, { 'login status 200': (r) => r.status === 200 });
  if (!ok) return null;

  const body = res.json();
  return body.data ? body.data.accessToken : body.accessToken;
}

// setup 단계에서 호출 — 토큰을 VU들에게 공유
export function setupAuth() {
  const token = login();
  if (!token) {
    console.error('Login failed — 테스트 계정이 존재하는지 확인하세요');
  }
  return { token };
}
