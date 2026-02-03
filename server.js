const express = require("express");
const path = require("path");
const parser = require("parse-whois");
const whois = require("whois");

const app = express();
const port = process.env.PORT || 3000;

const KEYS = [
  "Registrar Registration Expiration Date",
  "Registry Expiry Date",
  "Expiration Time",
  "paid-till",
];

function normalizeDomain(input) {
  if (!input) return "";
  try {
    return new URL(input).host;
  } catch {
    return new URL(`http://${input}`).host;
  }
}

async function getDatePaidTill(domain) {
  domain = normalizeDomain(domain);

  return new Promise((resolve, reject) => {
    whois.lookup(domain, function (err, data) {
      if (err) return reject(err);

      const parsedData = parser.parseWhoIsData(data);
      let paidTillDate;

      for (const [, param] of Object.entries(parsedData)) {
        if (KEYS.includes(String(param.attribute || "").trim())) {
          paidTillDate = new Date(param.value);
          break;
        }
      }

      if (!paidTillDate || Number.isNaN(paidTillDate.getTime())) {
        return reject(
          new Error(`No registry expiry date was found for domain ${domain}`)
        );
      }

      resolve(paidTillDate);
    });
  });
}

async function startServer() {
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  app.get("/check", async (req, res) => {
    const { domain } = req.query;
    if (!domain) {
      return res.status(400).json({
        domain: null,
        error: { message: "Missing domain parameter" },
      });
    }

    try {
      const paidTillDate = await getDatePaidTill(domain);
      const checkDate = new Date();
      const msLeft = paidTillDate.getTime() - checkDate.getTime();
      const daysLeft = Math.floor(msLeft / 86400000);

      const payload = {
        domain: normalizeDomain(domain),
        data: {
          checkDate: checkDate.toISOString(),
          paidTillDate: paidTillDate.toISOString(),
          daysLeft,
        },
      };

      // log checked domain and days left
      console.log(
        `[${payload.domain}] ${daysLeft} days left, paid till ${paidTillDate.toISOString()}`
      );

      // if expired return 410 Gone
      if (daysLeft < 0) {
        return res.status(410).json(payload);
      }

      // if less than 7 days left return 402 Payment Required
      // as a warning to renew the domain
      if (daysLeft < 7) {
        return res.status(402).json(payload);
      }

      // otherwise 200 OK
      return res.status(200).json(payload);
    } catch (error) {
      // if errors starts "No registry expiry date was found for domain" set status 404
      if (
        error.message.startsWith("No registry expiry date was found for domain")
      ) {
        return res.status(404).json({
          domain: normalizeDomain(domain),
          error: { message: error.message },
        });
      }

      // other errors 500
      return res.status(500).json({
        domain: normalizeDomain(domain),
        error: { message: error.message },
      });
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });


  process.on("SIGINT", async () => {
    process.exit();
  });
}

startServer();