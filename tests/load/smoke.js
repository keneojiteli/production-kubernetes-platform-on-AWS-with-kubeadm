// The smoke test answers: Is the deployed application basically reachable and functional?

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://kene-quiz.duckdns.org";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
    checks: ["rate>0.99"],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/api/questions`);

  check(response, {
    "status is 200": (res) => res.status === 200,
    "response contains body": (res) => Boolean(res.body),
  });

  sleep(1);
}