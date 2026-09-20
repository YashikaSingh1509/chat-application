export const PERMISSION_ACTIONS = {
  READ: "read",
  WRITE: "write",
} as const;

export const PERMISSION_MODULES = {
  RBAC: "Role Based Access Control",
  SUB_ADMIN: "sub_admin",
  BANNER: "banner",
  STREAMING: "streaming",
  NOTIFICATION: "notification",
  STATIC_PAGE: "CMS",
  DATA_LOG: "data_log",
  STREAM_PARTNER: "stream_partner",
  PAGE_ELEMENT: "page_element",
  VERSION: "version",
} as const;

export type PermissionAction =
  (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];
export type PermissionModule =
  (typeof PERMISSION_MODULES)[keyof typeof PERMISSION_MODULES];
