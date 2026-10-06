import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  route("auth", "routes/auth.tsx"),
  layout("layouts/main.tsx", [
    index("routes/home.tsx"),
    ...prefix("liturgies", [
      index("routes/liturgies.tsx"),
      route(":liturgyId", "routes/liturgy.tsx"),
    ]),
    route("songs", "routes/songs.tsx", [
      route("create", "routes/songs.create.tsx"),
      route(":songId", "routes/songs.$songId.tsx"),
    ]),
    route("recitations", "routes/recitations.tsx", [
      route("create", "routes/recitations.create.tsx"),
      route(":recitationId", "routes/recitations.$recitationId.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
