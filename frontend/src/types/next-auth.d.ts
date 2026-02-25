import "next-auth";
import "next-auth/jwt";

export interface UserPermissions {
  is_super_admin: boolean;
  can_manage_leads: boolean;
  can_do_analysis: boolean;
  can_manage_operations: boolean;
  can_manage_finance: boolean;
  can_manage_team: boolean;
  can_manage_onboarding: boolean;
}

declare module "next-auth" {
  interface User {
    role?: string;
    accessToken?: string;
    permissions?: UserPermissions;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      accessToken: string;
      permissions: UserPermissions;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    accessToken?: string;
    permissions?: UserPermissions;
  }
}
