import "dotenv/config";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import postRoutes from "./routes/postRoutes";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express(); //express app
const port = 8000;

app.use(cors({
    origin: true, // Reflects the incoming origin, allowing valid requests
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.use(express.json());

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Express API with MySQL and Swagger",
            version: "1.0.0",
            description: "A simple CRUD API application made with Express and documented with Swagger",
        },
        servers: [
            {
                url: "http://localhost:8000/api",
            },
        ],
    },
    apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
};

const specs = swaggerJsdoc(options);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

let isDbInitialized = false;

app.get("/health", (_, res) => {
    if (!isDbInitialized) {
        return res.status(503).json({ status: "initializing", database: "connecting" });
    }
    res.status(200).json({ status: "ok", database: "connected" });
});

app.use("/api/posts", postRoutes);

// Start server first so it can respond to health checks immediately
app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`Swagger UI is available at http://localhost:${port}/api/docs`);
});

// Initialize DB in the background
AppDataSource.initialize()
    .then(() => {
        isDbInitialized = true;
        console.log("✅ Data Source has been initialized!");
    })
    .catch((err) => {
        console.error("❌ Error during Data Source initialization", err);
        // We keep the server running so ECS doesn't enter a crash loop immediately, 
        // but health check will remain 503 if not initialized.
    });
