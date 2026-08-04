import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost";

export const options = {
  vus: 10,
  duration: "2m",
};

export default function () {
  const response = http.get(
    "https://kene-quiz.duckdns.org/api/questions"
  );

  check(response, {
    "status is 200": (res) => res.status === 200,
    "response is under 500ms": (res) => res.timings.duration < 500,
  });

  sleep(1);
}