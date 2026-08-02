import { onRequest as __api_tarkov_graphql_ts_onRequest } from "F:\\task-tracker\\functions\\api\\tarkov\\graphql.ts"

export const routes = [
    {
      routePath: "/api/tarkov/graphql",
      mountPath: "/api/tarkov",
      method: "",
      middlewares: [],
      modules: [__api_tarkov_graphql_ts_onRequest],
    },
  ]