
import { calculateAnalytics } from "../src/services/analyticsService.js";

describe("Analytics Service", () => {
  test("Should calculate analytics correctly", () => {
    const results = [
      { success: true, responseTime: 100 },
      { success: true, responseTime: 120 },
      { success: false, responseTime: 5000 },
      { success: true, responseTime: 140 },
      { success: false, responseTime: 5000 }
    ];

    const analytics = calculateAnalytics(results);

    expect(analytics.totalChecks).toBe(5);
    expect(analytics.successfulChecks).toBe(3);
    expect(analytics.failedChecks).toBe(2);
    expect(analytics.uptimePercentage).toBe(60);
    expect(analytics.averageResponseTime).toBe(120);
    expect(analytics.successRate).toBe(60);
  });

  test("Should return zero values for empty results", () => {
    const analytics = calculateAnalytics([]);

    expect(analytics.totalChecks).toBe(0);
    expect(analytics.uptimePercentage).toBe(0);
    expect(analytics.averageResponseTime).toBe(0);
  });

  test("Should handle all failed checks", () => {
    const results = [
      { success: false, responseTime: 5000 },
      { success: false, responseTime: 5000 }
    ];

    const analytics = calculateAnalytics(results);

    expect(analytics.failedChecks).toBe(2);
    expect(analytics.uptimePercentage).toBe(0);
    expect(analytics.averageResponseTime).toBe(0);
  });
});
