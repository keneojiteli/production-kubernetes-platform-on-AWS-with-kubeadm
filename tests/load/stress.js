// The stress test answers: At what point does performance deteriorate or the system begin to fail?

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://kene-quiz.duckdns.org";

export const options = {
  stages: [
    { duration: "1m", target: 10 },
    { duration: "2m", target: 25 },
    { duration: "2m", target: 50 },
    { duration: "2m", target: 75 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1500"],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/api/questions`);

  check(response, {
    "response is successful": (res) =>
      res.status >= 200 && res.status < 400,
  });

  sleep(0.5);
}