
import {
  scheduleMonitor,
  pauseMonitorSchedule,
  resumeMonitorSchedule,
  removeMonitorSchedule
} from "../src/services/monitorScheduler.js";

const testMonitor = {
  monitorId: "scheduler-test-001",
  url: "https://example.com",
  method: "GET",
  interval: 30,
  timeout: 5000,
  expectedStatus: 200
};

const runTest = async () => {
  try {
    console.log("\n1. Registering monitor...");
    await scheduleMonitor(testMonitor);

    console.log("\n2. Pausing monitor...");
    await pauseMonitorSchedule(testMonitor.monitorId);

    console.log("\n3. Resuming monitor...");
    await resumeMonitorSchedule(testMonitor);

    console.log("\n4. Updating monitor interval...");
    await scheduleMonitor({
      ...testMonitor,
      interval: 60
    });

    console.log("\n5. Removing monitor schedule...");
    await removeMonitorSchedule(testMonitor.monitorId);

    console.log("\nAll scheduler operations completed!");
  } catch (error) {
    console.error("Scheduler test failed:", error.message);
  } finally {
    process.exit(0);
  }
};

runTest();
