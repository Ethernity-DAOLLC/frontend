export {
  publicRoutes,
  PUBLIC_PATHS,
  getPublicRoute,
  isValidPublicRoute,
  PublicRouter,
} from './PublicRoutes';

export {
  userRoutes,
  USER_PATHS,
  getUserRoute,
  isValidUserRoute,
  UserRouter,
} from './UserRoutes';

export {
  adminRoutes,
  ADMIN_PATHS,
  getAdminRoute,
  isValidAdminRoute,
  AdminRouter,
  getAdminTabFromPath,
  useAdminAuth,
} from './AdminRoutes';

export type { AdminTab } from './AdminRoutes';

export {
  ALL_PATHS,
  getRouteType,
  requiresWallet,
  requiresCorrectNetwork,
  getNavigationGuards,
  validateNavigation,
} from './navigationGuards';

export type AppRoutePath = (typeof ALL_PATHS)[keyof typeof ALL_PATHS];
