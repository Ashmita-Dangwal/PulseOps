import mongoose from "mongoose";
import Incident from "../models/Incident.js";
import Monitor from "../models/Monitor.js";

export const persistIncidentDecision = async (monitor, decision) => {
  const monitorId = monitor._id;
  if (!monitorId) throw new Error("Cannot persist incident without a MongoDB monitor ID");

  if (decision.incidentAction === "CREATE") {
    try {
      await Incident.create({
        monitorId,
        userId: monitor.userId || null,
        title: `${monitor.name} is down`,
        description: "Three or more consecutive health checks failed.",
        reason: decision.incidentData?.reason || "Health check failed",
        failureCount: decision.incidentData?.failureCount || 3,
        status: "OPEN"
      });
    } catch (error) {
      // A concurrent worker may have created the unique open incident first.
      if (error.code !== 11000) throw error;
    }
  } else if (decision.incidentAction === "UPDATE") {
    await Incident.findOneAndUpdate(
      { monitorId, status: "OPEN" },
      {
        $set: {
          reason: decision.incidentData?.reason || "Health check continues to fail",
          failureCount: decision.incidentData?.failureCount || 3
        }
      }
    );
  } else if (decision.incidentAction === "RESOLVE") {
    await Incident.findOneAndUpdate(
      { monitorId, status: "OPEN" },
      { $set: { status: "RESOLVED", resolvedAt: new Date() } }
    );
  }

  await Monitor.findByIdAndUpdate(monitorId, {
    $set: {
      ...decision.monitorUpdates,
      hasOpenIncident: decision.incidentAction === "CREATE" || decision.incidentAction === "UPDATE"
        ? true
        : decision.incidentAction === "RESOLVE" ? false : monitor.hasOpenIncident
    }
  }, { runValidators: true });
};
