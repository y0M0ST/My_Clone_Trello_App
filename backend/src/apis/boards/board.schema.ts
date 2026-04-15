import { z } from 'zod';

export const addMemberToBoardSchema = z.object({
  email: z.email('Invalid email address'),
  roleId: z.uuid(),
});

export type AddBoardMemberInput = z.infer<typeof addMemberToBoardSchema>;

export const updateBoardMemberRoleSchema = z.object({
  roleId: z.uuid(),
});

export type UpdateBoardMemberRoleInput = z.infer<
  typeof updateBoardMemberRoleSchema
>;
