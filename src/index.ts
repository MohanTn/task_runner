import { buildServer } from './server.js';

const PORT = Number(process.env.PORT) || 5222;

const server = buildServer();

server.httpServer.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[task-runner] Port ${PORT} is already in use.\n` +
      `  Another server instance may still be running. Stop it first:\n` +
      `    kill $(lsof -ti :${PORT})\n` +
      `  Or pick a different port:\n` +
      `    PORT=5223 npm start\n`,
    );
  } else {
    console.error('[task-runner] Fatal server error:', err);
  }
  process.exit(1);
});

server.httpServer.listen(PORT, () => {
  console.log(`[task-runner] Listening on http://localhost:${PORT}`);
});
