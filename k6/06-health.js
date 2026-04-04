// k6/06-health.js — 전체 서비스 헬스체크 부하테스트
// 실행: k6 run k6/06-health.js
//
// Gateway를 경유하여 각 서비스 헬스체크 (K8s/로컬 모두 호환)
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';

const SERVICES = [
  { name: 'auth',     url: `${BASE_URL}/api/health/auth` },
  { name: 'document', url: `${BASE_URL}/api/health/document` },
  { name: 'agent',    url: `${BASE_URL}/api/health/agent` },
  { name: 'workflow', url: `${BASE_URL}/api/health/workflow` },
];

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  for (const svc of SERVICES) {
    const res = http.get(svc.url, { tags: { name: svc.name } });
    check(res, {
      [`${svc.name} healthy`]: (r) => r.status === 200,
    });
  }
  sleep(1);
}
