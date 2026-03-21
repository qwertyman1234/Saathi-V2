/**
 * Load Testing Script using k6
 * Tests payment flow under heavy load
 * 
 * Run with: k6 run load-test.js
 * Requires: npm install -g k6
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";

// Define metrics
const errorRate = new Rate("errors");
const apiDuration = new Trend("api_duration");
const paymentDuration = new Trend("payment_duration");
const paymentSuccess = new Counter("payments_success");
const paymentFailure = new Counter("payments_failure");
const concurrentUsers = new Gauge("concurrent_users");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Warm up: reach 10 users
    { duration: "1m", target: 50 }, // Ramp up: reach 50 users
    { duration: "3m", target: 100 }, // Stay: 100 users for 3 minutes
    { duration: "1m", target: 50 }, // Ramp down: back to 50
    { duration: "30s", target: 0 }, // Cool down
  ],
  thresholds: {
    errors: ["rate<0.05"], // Error rate < 5%
    api_duration: ["p(95)<500"], // 95th percentile < 500ms
    payment_duration: ["p(95)<2000"], // Payment < 2s
  },
};

const API_BASE_URL = "http://localhost:5173/api";
const RAZORPAY_ENDPOINT = "http://your-supabase.supabase.co/functions/v1/razorpay";

/**
 * Test: Hospital Search Performance
 */
export function testHospitalSearch() {
  group("Hospital Search", () => {
    const searchParams = {
      city: "Mumbai",
      specialty: "Cardiology",
      limit: 20,
    };

    const url = `${API_BASE_URL}/hospitals/search?${new URLSearchParams(
      searchParams
    ).toString()}`;

    const response = http.get(url);

    const success = check(response, {
      "status is 200": (r) => r.status === 200,
      "response time < 500ms": (r) => r.timings.duration < 500,
      "has results": (r) => r.body && r.body.length > 0,
    });

    errorRate.add(!success);
    apiDuration.add(response.timings.duration);

    sleep(1);
  });
}

/**
 * Test: Create Razorpay Order
 */
export function testCreateOrder() {
  group("Create Payment Order", () => {
    const payload = JSON.stringify({
      action: "create_order",
      planId: "gold",
      userId: `user_${__VU}_${__ITER}`,
      amount: 50000,
      planName: "Gold Plan",
      email: `test${__VU}@example.com`,
      phone: "+919876543210",
    });

    const params = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const response = http.post(RAZORPAY_ENDPOINT, payload, params);

    const success = check(response, {
      "status is 200": (r) => r.status === 200,
      "order created": (r) => r.body.includes("order_"),
      "response time < 1000ms": (r) => r.timings.duration < 1000,
    });

    errorRate.add(!success);
    paymentDuration.add(response.timings.duration);

    if (success) {
      paymentSuccess.add(1);
    } else {
      paymentFailure.add(1);
    }

    sleep(1);
  });
}

/**
 * Test: Verify Payment
 */
export function testVerifyPayment() {
  group("Verify Payment", () => {
    const payload = JSON.stringify({
      action: "verify_payment",
      razorpay_order_id: "order_123456",
      razorpay_payment_id: "pay_123456",
      razorpay_signature: "sig_123456",
      userId: `user_${__VU}`,
      planId: "gold",
    });

    const params = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const response = http.post(RAZORPAY_ENDPOINT, payload, params);

    const success = check(response, {
      "payment verified": (r) => r.status === 200 || r.status === 400,
      "response time < 500ms": (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
    apiDuration.add(response.timings.duration);

    sleep(1);
  });
}

/**
 * Test: Claim Submission
 */
export function testClaimSubmission() {
  group("Submit Claim", () => {
    const payload = JSON.stringify({
      policyId: "SAA-123456",
      hospitalName: "Apollo Hospital",
      claimAmount: 100000,
      admissionDate: "2026-03-01",
      dischargeDate: "2026-03-10",
      reason: "Appendectomy",
    });

    const params = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer token_${__VU}`,
      },
    };

    const response = http.post(`${API_BASE_URL}/claims/submit`, payload, params);

    const success = check(response, {
      "status is 200": (r) => r.status === 200 || r.status === 201,
      "claim number returned": (r) => r.body.includes("claim_"),
      "response time < 1000ms": (r) => r.timings.duration < 1000,
    });

    errorRate.add(!success);
    apiDuration.add(response.timings.duration);

    sleep(1);
  });
}

/**
 * Test: Complete Buy Flow
 */
export function testCompleteBuyFlow() {
  group("Complete Buy Flow", () => {
    const userId = `user_${__VU}_${__ITER}`;

    // 1. Search hospitals
    testHospitalSearch();

    // 2. Create order
    testCreateOrder();

    // 3. Verify payment
    testVerifyPayment();

    // 4. Check policy created
    const response = http.get(`${API_BASE_URL}/policies/${userId}`);

    check(response, {
      "policy created": (r) => r.status === 200,
    });

    sleep(2);
  });
}

/**
 * Main export function - runs the tests
 */
export default function main() {
  concurrentUsers.set(__VU);

  // Mix of different test scenarios
  const testType = __ITER % 4;

  switch (testType) {
    case 0:
      testHospitalSearch();
      break;
    case 1:
      testCreateOrder();
      break;
    case 2:
      testClaimSubmission();
      break;
    case 3:
      testCompleteBuyFlow();
      break;
  }
}

/**
 * Setup - runs once before tests
 */
export function setup() {
  console.log("Starting load test...");
}

/**
 * Teardown - runs once after tests
 */
export function teardown(data) {
  console.log("Load test completed");
}
