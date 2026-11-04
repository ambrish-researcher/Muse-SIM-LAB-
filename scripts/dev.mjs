import { spawn } from "node:child_process";
const tasks = [
  [
    "--experimental-strip-types",
    "--env-file-if-exists=.env",
    "server/index.ts",
  ],
  ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0", "--port", "5173"],
].map((args) =>
  spawn(process.execPath, args, { stdio: "inherit", windowsHide: true }),
);
const stop = () => tasks.forEach((p) => p.kill());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
tasks.forEach((p) =>
  p.on("exit", (code) => {
    if (code) stop();
  }),
);
