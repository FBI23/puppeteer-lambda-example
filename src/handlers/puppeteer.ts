import { Context, SQSRecord } from "aws-lambda";
import chromium from "chrome-aws-lambda";
import { Browser } from "puppeteer-core";

export const getPayload = (record: SQSRecord) => {
  const message = record.messageAttributes["payload"].stringValue || "{}";

  return JSON.parse(message);
};

const handler = async (event: any, context: Context): Promise<any> => {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log({ event });

  const { url, fileName } = event;

  let browser: null | Browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 800, // ensure the charts render for a4
        height: 900,
        deviceScaleFactor: 2,
      },
    });

    // Create a new incognito browser context.
    const page = await browser.newPage();

    await page.goto(url);

    await page.screenshot({
      type: "png",
      path: `${fileName}.png`,
    });

    console.log(`PUPPETEER SESSION COMPLETED`);
  } catch (error) {
    console.log("PUPPETEER ", error);

    return { body: JSON.stringify({ error }, null, 2), statusCode: 400 };
  } finally {
    if (browser !== null) {
      await browser.close();
    }

    return true;
  }
};

export { handler };
