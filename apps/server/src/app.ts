import express from 'express';
import cors from "cors";
import errorHandler from './middlewares/errorHandler.middleware';

// Import routes
import roleRoutes from "./routes/role.route";
import userRoutes from "./routes/user.route";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (_req, res) => {
  res.status(200).json({ message: "Server is healthy 🚀" });
});

app.use("/roles", roleRoutes);
app.use("/users", userRoutes);

app.use(errorHandler);

export default app;