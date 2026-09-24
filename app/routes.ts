import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  route("auth", "routes/auth.tsx"),
  layout("layouts/main.tsx", [
    index("routes/home.tsx"),
    ...prefix("liturgies", [
      index("routes/liturgies.tsx"),
      route(":liturgyId", "routes/liturgy.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
