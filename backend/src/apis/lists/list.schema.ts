import { z } from 'zod';

export const CreateListSchema = z.object({
  params: z.object({
    boardId: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
  }),
});

export const ListIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const MoveListToBoardSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    boardId: z.uuid(),
    position: z.number().int().min(0).optional(),
  }),
});

export const MoveAllCardsSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    targetListId: z.uuid(),
    targetBoardId: z.uuid().optional(),
  }),
});

export const CopyListSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    targetBoardId: z.uuid(),
    title: z.string().min(1).max(255).optional(),
    position: z.number().int().min(0).optional(),
  }),
});

export const EditListName = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    title: z.string().min(1).max(255),
  }),
});

export const ReorderList = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    prevListId: z.uuid(),
    nextListId: z.uuid(),
  }),
});
