// k6/06-health.js — 전체 서비스 헬스체크 부하테스트
// 실행: k6 run k6/06-health.js
//
// Gateway를 거치지 않고 각 서비스 직접 호출
import http from 'k6/http';
import { check, sleep } from 'k6';

const SERVICES = [
  { name: 'gateway',    url: 'http://localhost:8080/actuator/health' },
  { name: 'eureka',     url: 'http://localhost:8761/actuator/health' },
  { name: 'auth',       url: 'http://localhost:8081/health' },
  { name: 'document',   url: 'http://localhost:8082/health' },
  { name: 'agent',      url: 'http://localhost:8083/health' },
  { name: 'workflow',   url: 'http://localhost:8084/health' },
  { name: 'resource',   url: 'http://localhost:8085/health' },
];

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
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
