import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("/auth", "routes/auth.tsx"),
  layout("layouts/main.tsx", [index("routes/home.tsx")]),
] satisfies RouteConfig;
