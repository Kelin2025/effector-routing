# Effector Routing

Simple abstact router on top of Effector. Also has React bindings and DOM adapter

## Installation

```bash
npm i effector-routing
```

## Usage

### Init router

```js
import { addRoutes } from "effector-routing"
import { initDomRouter } from "effector-routing/dist/dom"

const routes = {
  home: {
    view: HomePage,
    meta: {
      path: "/"
    }
  },
  posts: {
    view: PostsList,
    meta: {
      path: "/posts"
    }
  },
  singlePost: {
    view: SinglePost,
    meta: {
      path: "/posts/:id"
    }
  }
}

addRoutes(routes)
initDomRouter({
  defaultRoute: { name: "home" }
})
```

### Navigation, stores and events

```js
import {
  $route,
  goTo,
  historyBack,
  beforeRouteEnter,
  routeChanged,
  onRouteChanged
} from "effector-routing"

// Imperative navigation
// Both functions are Effects
goTo({ name: "posts" })
goTo({ name: "singlePost", params: { id: 1 } })
historyBack()

// $route is a Store which contains current { name, params }
// So you can .map, .watch, combine etc
const $postId = $route.map(({ name, params }) =>
  name === "singlePost" ? params.id : null
)

// Add a middleware
beforeRouteEnter(({ name, params }) => {
  // Navigate "as is"
  if (name !== "singlePost") {
    return
  }

  // Change route
  if (params.id === 2) {
    return {
      name: "singlePost",
      params: { id: 1 }
    }
  }

  // Undo navigation
  if (params.id === 3) {
    return false
  }
})

// Call something on route change
onRouteChanged(({ name, params }) => {
  console.log({ name, params })
})

// Also available as an Event
routeChanged.watch(({ name, params }) => {
  console.log({ name, params })
})
```

### Use with React

#### Components

```js
import React from 'react'
import { RouteLink, RouterView } from "effector-routing/dist/react"

const Menu = () => {
  return <nav>
    <RouteLink name="home">Home</RouteLink>
    <RouteLink name="posts">Posts</RouteLink>
    <RouteLink name="singlePost" params={{id:1}}>View Post (ID: 1)</RouterLink>
  </nav>
}

const App = () => {
  return (
    <div>
      <Menu />
      <RouterView />
    </div>
  )
}
```

#### Example with useStore

```js
import React from "react"
import { combine } from "effector"
import { useStore } from "effector-react"

import { $route } from "effector-routing"
import { $postsList } from "./stores"

const $postId = $route.map(({ params }) => params.id)

const $currentPost = combine($postId, $postsList, (id, list) =>
  list.find(post => post.id === id)
)

const Post = () => {
  const currentPost = useStore($currentPost)

  return (
    <article>
      <h1>{currentPost.title}</h1>
      <p>{currentPost.description}</p>
    </article>
  )
}
```

### Writing your own adapter

If you want to write your own adapter
Here's an example of adapter which stores last route in LocalStorage (e.g. for Electron)

```js
import { initFirstRoute, onRouteChanged } from "effector-routing"

export const initLsRouter = ({ defaultRoute }) => {
  let lastRoute = defaultRoute
  try {
    lastRoute = JSON.parse(localStorage.lastRoute)
  } catch (err) {
    lastRoute = defaultRoute
  }

  initFirstRoute(defaultRoute)
  onRouteChanged(newRoute => {
    localStorage.lastRoute = JSON.stringify({
      name: newRoute.name,
      params: newRoute.params
    })
  })
}
```

And just use it then

```js
import { addRoutes } from "effector-routing"
import { initLsRouter } from "./adapter"

const routes = {
  /* ... */
}

addRoutes(routes)
initLsRouter()
```
