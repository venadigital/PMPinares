process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.HOSTNAME = "0.0.0.0";

const { existsSync } = require("node:fs");
const { createServer } = require("node:http");
const { join } = require("node:path");

const port = Number.parseInt(process.env.PORT || "3000", 10);
// Hostinger can expose HOSTNAME as the container/machine name. Binding to that
// value may crash the Node process, so bind explicitly to all interfaces.
const hostname = "0.0.0.0";
const standaloneServer = join(__dirname, ".next", "standalone", "server.js");

process.on("uncaughtException", (error) => {
  console.error("Uncaught runtime exception", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled runtime rejection", reason);
});

if (existsSync(standaloneServer)) {
  console.log("Starting Pinares Project Control with Next standalone runtime.");
  require(standaloneServer);
} else {
  const next = require("next");
  const app = next({ dev: false, hostname, port });
  const handle = app.getRequestHandler();

  app
    .prepare()
    .then(() => {
      createServer(async (request, response) => {
        try {
          if (request.url === "/health") {
            response.statusCode = 200;
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({ ok: true, service: "pinares-project-control" }));
            return;
          }

          await handle(request, response);
        } catch (error) {
          console.error(`Request failed: ${request.method} ${request.url}`, error);
          if (!response.headersSent) {
            response.statusCode = 500;
            response.end("Internal server error");
          }
        }
      }).listen(port, hostname, () => {
        console.log(`Pinares Project Control ready on http://${hostname}:${port}`);
      });
    })
    .catch((error) => {
      console.error("Failed to start Pinares Project Control", error);
      process.exit(1);
    });
}
