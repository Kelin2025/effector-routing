import { initFirstRoute, onRouteChanged } from "."

export const initDomRouter = ({ defaultRoute }) => {
  let route = defaultRoute

  for (const [name, route] of Object.entries(routes)) {
    if (pathToRegexp(route.meta.path).exec(location.pathname)) {
      route = { name, params: history.state && history.state.params }
      break
    }
  }

  initFirstRoute(route)

  onRouteChanged(newRoute => {
    history.pushState(
      { name: newRoute.name, params: newRoute.params },
      null,
      pathToRegexp.compile(newRoute.routeInfo.meta.path)(newRoute.params)
    )
  })
}
