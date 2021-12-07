import { Lambda } from "aws-sdk";
import express from "express";
import { AWS_CREDENTIALS, IS_OFFLINE, STAGE } from "../config";
import serverlessHttp = require("serverless-http");

const cors = require("cors");
const app: express.Application = express();

app.use(
  cors({
    ...(IS_OFFLINE
      ? {}
      : {
          origin: ["https://example.com", /\.example\.com$/],
          credentials: true,
        }),
  })
);

const router = express.Router();

app.use(express.json());

export const log = (message: any, props?: any) => {
  console.log(JSON.stringify({ message, props }, null, 2));
};

router.get(
  "/status",
  async (req: express.Request, res: express.Response): Promise<void> => {
    res.json({ env: process.env.STAGE });
  }
);

// Puppeteer Test
router.get(
  "/test",
  async (req: express.Request, res: express.Response): Promise<void> => {
    const lambdaConfig = {
      ...(IS_OFFLINE
        ? { endpoint: "http://localhost:3002", credentials: AWS_CREDENTIALS }
        : {
            region: "eu-west-1",
          }),
    };

    const lambda = new Lambda(lambdaConfig);

    const params = {
      FunctionName: "puppeteer-scraper-example-dev-puppeteer", // <service>-<stage>-<lambda name>
      InvocationType: "Event", // Async
      Payload: JSON.stringify({ url: "https://sovtech.com", fileName: "derp" }),
    };

    await lambda.invoke(params).promise();

    res.json({ message: "puppeteer invoked" });
  }
);

IS_OFFLINE ? app.use(`/`, router) : app.use(`/${STAGE}`, router);

export const handler = serverlessHttp(app, {
  callbackWaitsForEmptyEventLoop: false,
});
