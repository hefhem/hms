import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  scenarios: {
    baseline: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '3m', target: 25 },
        { duration: '2m', target: 0 },
      ]
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<600']
  }
};

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:8080';
  let res = http.get(`${base}/patients?mrn=MRN-1001`);
  check(res, { 'status is 200 or 404': (r) => r.status === 200 || r.status === 404 });
  sleep(1);
}
