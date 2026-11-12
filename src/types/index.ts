import type { Role, ReportStatus } from "@prisma/client";

export type { Role, ReportStatus };

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  mustChangePassword: boolean;
};

export type ApiResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
