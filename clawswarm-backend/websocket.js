import { WebSocketServer } from "ws";
import { createEvent } from "./protocol.js";

export function createMissionWebSocketHub({ getState }) {
  const clients = new Set();
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (socket) => {
    clients.add(socket);
    socket.send(JSON.stringify(createEvent("snapshot", getState())));

    socket.on("close", () => {
      clients.delete(socket);
    });
  });

  return {
    attach(server) {
      server.on("upgrade", (request, socket, head) => {
        const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
        if (url.pathname !== "/ws") {
          socket.destroy();
          return;
        }

        wss.handleUpgrade(request, socket, head, (client) => {
          wss.emit("connection", client, request);
        });
      });
    },
    broadcast(event) {
      const payload = JSON.stringify(event);
      for (const client of clients) {
        if (client.readyState === client.OPEN) {
          client.send(payload);
        }
      }
    },
    close() {
      for (const client of clients) {
        client.close();
      }
      wss.close();
    }
  };
}
