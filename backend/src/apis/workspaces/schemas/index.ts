import {
  extendZodWithOpenApi,
  ZodRequestBody,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export type Workspace = z.infer<typeof WorkspaceSchema>;
export const WorkspaceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  visibility: z.enum(['private', 'public']).optional(),
  members: z.array(z.string()).optional(),
  boards: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GetWorkspaceSchema = z.object({
  params: z.object({ id: z.uuid('ID must be a valid UUID') }),
});

export const CreateWorkspaceContentSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(['private', 'public']).optional(),
});

export const PostWorkspace: ZodRequestBody = {
  description: 'Create a new workspace',
  content: {
    'application/json': {
      schema: CreateWorkspaceContentSchema,
    },
  },
};

export const GetMemberSchema = z.object({
  params: z.object({
    id: z.uuid('ID must be a valid UUID'),
    memberId: z.uuid('ID must be a valid UUID'),
  }),
});

// --- Define Create Workspace Member Schemas ---
export const CreateWorkspaceMemberContentSchema = z.object({
  userId: z.uuid('User ID must be a valid UUID'),
  roleId: z.uuid('Role ID must be a valid UUID'), // Optional để có thể dùng default role
});

export const PostWorkspaceMember: ZodRequestBody = {
  description: 'Add a new workspace member',
  content: {
    'application/json': {
      schema: CreateWorkspaceMemberContentSchema,
    },
  },
};

// --- Define Update Workspace Schemas ---
export const UpdateWorkspaceContentSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  visibility: z.enum(['private', 'public']).optional(),
});

export const UpdateWorkspace: ZodRequestBody = {
  description: 'Update an existing workspace',
  content: {
    'application/json': {
      schema: UpdateWorkspaceContentSchema,
    },
  },
};

export const UpdateWorkspaceSchema = z.object({
  body: UpdateWorkspaceContentSchema,
  params: z.object({ id: z.uuid('ID must be a valid UUID') }),
});

// --- Define Update Workspace Member Schemas ---
export const UpdateMemberContentSchema = z.object({
  roleId: z.uuid('Role ID must be a valid UUID'),
});

export const PatchMember: ZodRequestBody = {
  description: 'Update an existing workspace member',
  content: {
    'application/json': {
      schema: UpdateMemberContentSchema,
    },
  },
};

// User schema for responses
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  roleId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
