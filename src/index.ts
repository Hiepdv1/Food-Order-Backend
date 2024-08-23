import express from "express";

import InitializeApp from "./services/InitializeApp.service";
import { logger } from "./logs";
import App from "./services/ExpressApp.service";

const StartServer = () => {
    InitializeApp();

    const app = express();

    App(app);

    app.listen(8001, () => {
        logger.info("App is listening to the port 8001");
    });
};

StartServer();
