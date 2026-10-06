export const publicRoutes = {
  home: "/",
  announcements: "/announcements",
  events: "/events",
  chapters: "/chapters",
  login: "/login",
  register: "/register",
} as const;

export const protectedRoutes = {
  assistance: "/assistance",
  collaborations: "/collaborations",
  admin: "/admin",
} as const;
