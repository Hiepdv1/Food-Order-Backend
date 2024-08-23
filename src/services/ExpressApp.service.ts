import express, { Application } from "express";
import cookieParser from "cookie-parser";
import compression from "compression";

import Routes from "../routes";
import { GlobalErrorHandler } from "../middlewares";
import { sessionConfig } from "../configs/Session.config";
import { upload } from "../configs";
import { handleRollbackData } from "../middlewares/Rollback.middleware";
import { ResponseHandler } from "../middlewares/Response.middleware";

const App = (app: Application) => {
    if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

    app.use(upload.any());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true, limit: "20kb" }));
    app.use(cookieParser());
    app.use(compression());
    app.use(sessionConfig);
    app.use(ResponseHandler);

    app.use(Routes);

    app.use(handleRollbackData);

    app.use(GlobalErrorHandler);

    return app;
};

export default App;
