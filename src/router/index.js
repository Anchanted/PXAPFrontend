import Vue from 'vue'
import Router from 'vue-router'
import store from 'store'

import PageNotFound from 'views/404'
import Place from 'views/Place'
import Search from 'views/Search'
import Direction from 'views/Direction'
import OriginalMap from 'views/OriginalMap'
import CheckMap from 'views/deprecated/CheckMap'
import Spanish from 'views/Spanish'
import MapPage from 'views/MapPage'

Vue.use(Router)

const routes = [
  {
    path: "*",
    component: PageNotFound,
    name: "PageNotFound"
  },
  {
    path: "/original/:buildingCode([a-z]{2})?/:floorIndex(-?\\d+)?",
    component: OriginalMap,
    name: 'OriginalMap'
  },
  {
    path: "/check/:buildingCode([a-z]{2})/:floorIndex(-?\\d+)",
    component: CheckMap,
    name: 'CheckMap'
  },
  {
    path: "/spanish",
    component: Spanish,
    name: 'Spanish'
  },
  {
    // path: '/:floorId(\\d+)?/@:latitude((-)?([^0][0-9]+|0)+\\.([0-9]{1,2})),:longitude((-)?([^0][0-9]+|0)+\\.([0-9]{1,2})),:zoom(\\d\\.([0-9]{1,2}))',
    // path: '/:floorId(\\d+)?/@:x(\\d+)?,:y(\\d+)?,:zoom(\\d|\\d\\.\\d{1,2})?z',
    path: "/@:locationInfo?/:floorId(\\d+)?",
    alias: "/:floorId(\\d+)?",
    component: MapPage,
    name: "Map",
    children: [
      {
        path: "/search/@:locationInfo?/:floorId(\\d+)?",
        alias: "search",
        component: Search,
        name: "Search",
        meta: {
          keepAlive: true
        },
      },
      {
        path: "/place/@:locationInfo?/:floorId(\\d+)?",
        alias: "place",
        component: Place,
        name: "Place",
        meta: {
          keepAlive: true,
        },
      },
      {
        path: "/dir/:fromText([^/]*)?/:toText([^/]*)?/@:locationInfo?/:floorId(\\d+)?",
        alias: "dir/:fromText([^/]*)?/:toText([^/]*)?",
        components: {
          direction: Direction
        },
        name: "Direction",
        meta: {
          keepAlive: true
        }
      }
    ],
  }
]

const router = new Router({
  routes,
  mode: 'history',
  base: process.env.NODE_ENV === "production" ? "/d/" : "/"
})

router.beforeEach((to, from, next) => {
  if (to.matched?.[0]?.name !== "Map") {
    next()
    return
  }
  if (to.name === "Search" && !to.query.q) {
    next({ name: "Map" })
  } else {
    if (!from?.name || !from?.matched?.length) {
      if (to.name.match(/Place|Direction/)) {
        store.commit("setFirstRouteName", to.name)
      }
    }
    if (decodeURIComponent(to.fullPath.split(/@.*?(\?|$)/).join("")) !== decodeURIComponent(from.fullPath.split(/@.*?(\?|$)/).join(""))) {
      store.commit("direction/setDisplayDirection", false)
      // // go to another page
      // store.commit('setPanelCollapsed', false)
      // store.commit('setModalCollapsed', true)
  
      let globalText = ""
      store.commit("setDisplayDirectionButton", to.matched.length <= 1)
      if (to.matched.length > 1) {
        store.commit('setPanelCollapsed', false)
        if (to.name === "Direction" && !store.state.modalCollapsed) store.commit("setModalRouterLeave", true)
        store.commit('setModalCollapsed', to.name === "Direction")
        if (to.name === "Direction") store.commit("direction/setDisplayDirection", true)
  
        if (to.name === 'Search') globalText = decodeURIComponent(to.query.q || '')
        else if (to.name === 'Place') globalText = to.params.name || ''
      }
      store.commit("setGlobalText", globalText)
  
      $('[data-toggle="tooltip"]').tooltip("dispose");
      $('[data-tooltip="tooltip"]').tooltip("dispose");
      $('[data-toggle="tooltip"]').tooltip();
      $('[data-tooltip="tooltip"]').tooltip();
    }
    next()
  }
})
export default router


