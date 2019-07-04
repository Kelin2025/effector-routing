import {
  createStore,
  createEvent,
  createStoreObject,
  combine,
  createEffect
} from "effector"

export const $name = createStore(null)
export const $params = createStore({})
export const $routes = createStore({})
export const $middlewares = createStore([])
export const $history = createStore([])

export const addRoutes = createEvent("Add routes")
export const addMiddleware = createEvent("Add middleware")
export const goTo = createEffect("Go to")
export const initFirstRoute = createEvent("Init first route")
export const historyBack = createEffect("History back")

export const $routeInfo = combine(
  $name,
  $routes,
  (name, routes) => routes[name]
)
export const $routeMeta = $routeInfo.map(route => (route && route.meta) || {})

export const $historyItem = createStoreObject({
  name: $name,
  params: $params
})

export const $route = createStoreObject({
  name: $name,
  params: $params,
  routeInfo: $routeInfo
})

export const beforeRouteEnter = addMiddleware
export const routeChanged = goTo.done.map(({ result }) => result)
export const onRouteChanged = routeChanged.watch

$name
  .on(goTo.done, (state, { result }) => result.name)
  .on(historyBack.done.map(p => p.result), (state, route) => route.name)

$params
  .on(goTo.done, (state, { result }) => result.params || {})
  .on(historyBack.done.map(p => p.result), (state, route) => route.params)

$history
  .on($historyItem, (state, item) => [...state, item])
  .on(historyBack.done, state => state.slice(0, -1))

$routes.on(addRoutes, (state, routes) => ({ ...state, ...routes }))

$middlewares.on(addMiddleware, (state, middleware) => [...state, middleware])

const navigate = async ({ name, params = {} }) => {
  let res = { name, params }

  for (const middleware of $middlewares.getState()) {
    const nextRes = await middleware({ name, params })

    if (nextRes === false) {
      return Promise.reject("REJECTED")
    }
    if (typeof nextRes === "object") {
      res = { name: nextRes.name, params: nextRes.params || {} }
    }
  }

  const routeInfo = $routes.getState()[name]

  if (!routeInfo) {
    return Promise.reject("NOT_FOUND")
  }

  if (routeInfo.redirect) {
    return navigate({
      name: routeInfo.redirect.name,
      params: routeInfo.redirect.params
    })
  }

  return {
    name: res.name,
    params: res.params,
    routeInfo: routeInfo
  }
}

goTo.use(navigate)

initFirstRoute.watch(goTo)

historyBack.use(() => {
  if (!$history.getState().length) {
    return Promise.reject("EMPTY")
  }
  return $history.getState().slice(-1)[0]
})
