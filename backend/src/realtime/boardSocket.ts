import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { verifyJwt } from '@/common/utils/jwtUtils';

let io: Server | null = null;

function parseAllowedOrigins(): string | string[] | boolean {
  const raw = process.env.FRONTEND_URL?.trim();
  if (!raw) return true;
  const base = raw.replace(/\/$/, '');
  return [raw, base];
}

/**
 * WebSocket hub: clients join `board:{boardId}` và nhận `board:changed` khi có cập nhật kéo thả / comment.
 */
export function attachBoardSocket(httpServer: HttpServer): Server {
  if (io) return io;

  io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: parseAllowedOrigins(),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        next(new Error('UNAUTHORIZED'));
        return;
      }
      const decoded = verifyJwt(token) as { userId?: string };
      if (!decoded?.userId) {
        next(new Error('UNAUTHORIZED'));
        return;
      }
      (socket.data as { userId: string }).userId = decoded.userId;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.on('board:join', (boardId: unknown) => {
      if (typeof boardId !== 'string' || !boardId) return;
      void socket.join(`board:${boardId}`);
    });
    socket.on('board:leave', (boardId: unknown) => {
      if (typeof boardId !== 'string' || !boardId) return;
      void socket.leave(`board:${boardId}`);
    });
  });

  return io;
}

export function emitBoardChanged(boardId: string, reason: string): void {
  if (!io || !boardId) return;
  io.to(`board:${boardId}`).emit('board:changed', { boardId, reason });
}
