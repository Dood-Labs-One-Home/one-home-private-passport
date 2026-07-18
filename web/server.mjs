import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  createConstructorContext,
  createCircuitContext,
  dummyContractAddress
} from "@midnight-ntwrk/compact-runtime";

import {
  Contract
} from "../contract/src/managed/passport/contract/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8080);
const QUALIFYING_CREDENTIAL = "ONEHOME";

function credentialToField(value) {
  const hash = crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");

  return BigInt(`0x${hash.slice(0, 15)}`);
}

function verifyWithCompact(privateCredential) {
  const requiredCredential = credentialToField(
    QUALIFYING_CREDENTIAL
  );

  const privateState = {
    credential: credentialToField(privateCredential)
  };

  const witnesses = {
    privateCredential(context) {
      return [
        context.privateState,
        context.privateState.credential
      ];
    }
  };

  const contract = new Contract(witnesses);
  const testCoinPublicKey = new Uint8Array(32);

  const constructorContext = createConstructorContext(
    privateState,
    testCoinPublicKey
  );

  const initialState = contract.initialState(
    constructorContext,
    requiredCredential
  );

  const circuitContext = createCircuitContext(
    dummyContractAddress(),
    initialState.currentZswapLocalState,
    initialState.currentContractState,
    privateState
  );

  const verification =
    contract.circuits.verifyEligibility(circuitContext);

  return verification.result;
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });

  response.end(JSON.stringify(data));
}

async function readJsonBody(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;

    if (body.length > 10_000) {
      throw new Error("Request too large");
    }
  }

  return JSON.parse(body || "{}");
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(
      request.url || "/",
      `http://${request.headers.host || "localhost"}`
    );

    const pathname = requestUrl.pathname;

    if (
      request.method === "POST" &&
      pathname === "/api/verify"
    ) {
      const body = await readJsonBody(request);
      const credential =
        typeof body.credential === "string"
          ? body.credential.trim()
          : "";

      if (!credential) {
        sendJson(response, 400, {
          error: "A private credential is required."
        });
        return;
      }

      const eligible = verifyWithCompact(credential);

      sendJson(response, 200, {
        eligible
      });

      return;
    }

    if (
      request.method === "GET" &&
      (pathname === "/" || pathname === "/index.html")
    ) {
      const indexPath = path.join(__dirname, "index.html");
      const html = await fs.readFile(indexPath);

      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });

      response.end(html);
      return;
    }

    if (
      request.method === "GET" &&
      pathname === "/favicon.ico"
    ) {
      response.writeHead(204);
      response.end();
      return;
    }

    sendJson(response, 404, {
      error: "Not found",
      path: pathname
    });
  } catch (error) {
    console.error(
      "Verification request failed:",
      error instanceof Error ? error.message : error
    );

    sendJson(response, 500, {
      error: "Private verification failed."
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `One Home Private Passport running at http://localhost:${PORT}`
  );

  console.log(
    "The API is using the generated Midnight Compact contract."
  );
});
