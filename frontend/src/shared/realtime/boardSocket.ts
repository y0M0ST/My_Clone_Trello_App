import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "@/shared/utils/tokenStorage";

/**
 * Kết nối WebSocket (Socket.io) tới cùng host với API, join room board và refetch khi có thay đổi từ user khác.
 */
export function subscribeBoardRealtime(
  boardId: string,
  onInvalidate: () => void
): () => void {
  const apiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  const token = tokenStorage.getAccessToken();
  if (!apiBase || !token) {
    return () => undefined;
  }

  const socket: Socket = io(apiBase, {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
  });

  let debounce: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = null;
      onInvalidate();
    }, 280);
  };

  socket.on("connect", () => {
    socket.emit("board:join", boardId);
  });

  socket.on("board:changed", (payload: { boardId?: string }) => {
    if (!payload?.boardId || payload.boardId === boardId) {
      schedule();
    }
  });

  return () => {
    if (debounce) clearTimeout(debounce);
    socket.emit("board:leave", boardId);
    socket.removeAllListeners();
    socket.disconnect();
  };
}
