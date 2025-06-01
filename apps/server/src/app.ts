import express from 'express';
import cors from "cors";
import errorHandler from './middlewares/errorHandler.middleware';

import roleRoutes from "./routes/role.route";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (_req, res) => {
  res.status(200).json({ message: "Server is healthy 🚀" });
});

// Import routes
app.use("/roles", roleRoutes);


app.use(errorHandler);

export default app;