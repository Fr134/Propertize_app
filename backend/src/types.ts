export type Permission =
  | "can_manage_leads"
  | "can_do_analysis"
  | "can_manage_operations"
  | "can_manage_finance"
  | "can_manage_team"
  | "can_manage_onboarding";

export type AppEnv = {
  Variables: {
    userId: string;
    role: string;
    isSuperAdmin: boolean;
    permissions: Record<Permission, boolean>;
  };
};
