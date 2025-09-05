import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from './middlewares/errorHandler.middleware';

// Import routes
import roleRoutes from "./routes/role.route";
import userRoutes from "./routes/employee.route";
import projectRoutes from "./routes/project.route";
import authRoutes from "./routes/auth.route";
import adminRoutes from "./routes/admin.route";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // your frontend URL
    credentials: true, // allow cookies / auth headers
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 


app.get("/", (_req, res) => {
  res.status(200).json({ message: "Server is healthy 🚀" });
});

app.use("/roles", roleRoutes);
app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

app.use(errorHandler);

export default app;