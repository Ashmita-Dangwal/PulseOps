
export const calculateAnalytics = (checkResults = []) => {
  const totalChecks = checkResults.length;

  // Handle the case where no checks exist
  if (totalChecks === 0) {
    return {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      uptimePercentage: 0,
      averageResponseTime: 0,
      successRate: 0
    };
  }

  // Separate successful and failed checks
  const successfulResults = checkResults.filter(
    (result) => result.success === true
  );

  const failedResults = checkResults.filter(
    (result) => result.success === false
  );

  const successfulChecks = successfulResults.length;
  const failedChecks = failedResults.length;

  // Calculate uptime based on check counts
  const uptimePercentage =
    (successfulChecks / totalChecks) * 100;

  // Calculate average response time from successful checks
  const totalResponseTime = successfulResults.reduce(
    (sum, result) => sum + result.responseTime,
    0
  );

  const averageResponseTime =
    successfulChecks > 0
      ? totalResponseTime / successfulChecks
      : 0;

  const successRate = uptimePercentage;

  return {
    totalChecks,
    successfulChecks,
    failedChecks,
    uptimePercentage: Number(uptimePercentage.toFixed(2)),
    averageResponseTime: Number(averageResponseTime.toFixed(2)),
    successRate: Number(successRate.toFixed(2))
  };
};
