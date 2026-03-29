// k6/02-project-crud.js — 프로젝트 CRUD 부하테스트
// 실행: k6 run k6/02-project-crud.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, authHeaders } from './config.js';
import { setupAuth } from './helpers.js';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '30s', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{name:list_projects}': ['p(95)<500'],
    'http_req_duration{name:create_project}': ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
  },
};

export function setup() {
  return setupAuth();
}

export default function (data) {
  if (!data.token) return;
  const params = authHeaders(data.token);

  // 1) 프로젝트 목록 조회
  const listRes = http.get(`${BASE_URL}/api/project`, Object.assign({ tags: { name: 'list_projects' } }, params));
  check(listRes, { 'list 200': (r) => r.status === 200 });

  sleep(0.5);

  // 2) 프로젝트 생성
  const createRes = http.post(
    `${BASE_URL}/api/project`,
    JSON.stringify({
      name: `k6-test-${Date.now()}-${__VU}`,
      description: 'k6 부하테스트 프로젝트',
    }),
    Object.assign({ tags: { name: 'create_project' } }, params),
  );
  check(createRes, {
    'create 200/201': (r) => r.status === 200 || r.status === 201,
  });

  // 3) 생성된 프로젝트로 수정 테스트
  if (createRes.status === 200 || createRes.status === 201) {
    const body = createRes.json();
    const projectId = body.data?.id || body.id;
    if (projectId) {
      sleep(0.3);
      const updateRes = http.put(
        `${BASE_URL}/api/project/${projectId}`,
        JSON.stringify({ name: `k6-updated-${Date.now()}`, description: 'updated' }),
        Object.assign({ tags: { name: 'update_project' } }, params),
      );
      check(updateRes, { 'update 200': (r) => r.status === 200 });
    }
  }

  sleep(1);
}
