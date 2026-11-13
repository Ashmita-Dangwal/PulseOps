
import { calculateAnalytics } from "../services/analyticsService.js";

export const getAnalytics = async (req, res, next) => {
  try {
    // Temporary empty data until database integration
    const checkResults = [];

    const analytics = calculateAnalytics(checkResults);

    res.status(200).json({
      success: true,
      message: "Analytics retrieved successfully",
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};
