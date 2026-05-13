import { buildServer } from './server.js';

const PORT = Number(process.env.PORT) || 5222;

const server = buildServer();

server.httpServer.listen(PORT, () => {
  console.log(`Task Runner server listening on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});
