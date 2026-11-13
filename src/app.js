import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import healthRoutes from "./routes/healthRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import monitorRoutes from "./routes/monitorRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/monitors", monitorRoutes);
app.use("/api/analytics", analyticsRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "PulseOps Backend is running!"
  });
});

app.use(errorMiddleware);
export default app;