import Vue from 'vue'
import Router from 'vue-router'
import PageNotFound from 'views/404'
import Place from 'views/Place'
import SearchTop from 'views/Search/SearchTop'
import SearchMore from 'views/Search/SearchMore'
import Direction from 'views/Direction'
import OriginalMap from 'views/OriginalMap'
import CheckMap from 'views/deprecated/CheckMap'
import TimetableForm from 'views/deprecated/TimetableForm'
// import TimetableCheck from 'views/deprecated/TimetableTest3'
import TimetableCheck from 'components/deprecated/ElasticTimetable'
import CanvasMap from 'views/CanvasMap'

import store from 'store'

Vue.use(Router)

const routes = [
  {
    path: "*",
    component: PageNotFound,
    name: 'PageNotFound'
  },
  {
    path: "/original/:buildingCode([a-z]{2})/:floorIndex(-?\\d+)",
    component: OriginalMap,
    name: 'OriginalMap'
  },
  {
    path: "/check/:buildingCode([a-z]{2})/:floorIndex(-?\\d+)",
    component: CheckMap,
    name: 'CheckMap'
  },
  {
    path: "/timetable/form",
    component: TimetableForm,
    name: 'TimetableForm'
  },
  {
    path: "/timetable/table",
    component: TimetableCheck,
    name: 'TimetableCheck'
  },
  {
    path: '/:buildingId(\\d+)?/:floorId(\\d+)?',
    component: CanvasMap,
    name: "Map",
    children: [
      {
        path: 'search',
        component: SearchTop,
        name: 'SearchTop',
        meta: {
          keepAlive: true
        },
      },
      {
        path: 'search/:type(building|room|facility)',
        component: SearchMore,
        name: 'SearchMore',
        meta: {
          keepAlive: false,
          display: true
        },
      },
      {
        path: 'place/:type(building|room|facility)/:id(\\d+)',
        component: Place,
        name: 'Place',
        meta: {
          keepAlive: false,
        },
      },
      {
        path: "dir/:fromPlace([^/]*)?/:toPlace([^/]*)?",
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
  base: '/'
})

router.beforeEach((to, from, next) => {
  if (to.params.buildingId && !to.params.floorId) next({ name: 'PageNotFound' })
  else if (to.name === "Direction" && (to.params.buildingId || to.params.floorId)) next({ name: "Map", params: to.params })
  else {
    if (to.matched?.[0]?.name === "Map") {
      const fromBuildingId = from.params.buildingId || ''
      const fromFloorId = from.params.floorId || ''
      const toBuildingId = to.params.buildingId || ''
      const toFloorId = to.params.floorId || ''
      
      store.commit("direction/setDisplayDirection", false)
      if (`b${fromBuildingId}f${fromFloorId}` !== `b${toBuildingId}f${toFloorId}`) { // go to another page
        store.commit('setPanelCollapsed', false)
        store.commit('setModalCollapsed', true)
      }

      let globalText = ""
      if (to.matched.length > 1) {
        store.commit("setDisplayDirectionButton", false)
        store.commit('setPanelCollapsed', false)
        store.commit('setModalCollapsed', to.name === "Direction")
        if (to.name === "Direction") store.commit("direction/setDisplayDirection", true)

        if (to.name.indexOf('Search') !== -1) globalText = decodeURIComponent(to.query.q || '')
        else if (to.name === 'Place') globalText = to.params.name || ''
      } else store.commit("setDisplayDirectionButton", true)

      store.commit('setGlobalText', globalText)
    }
    next()
  }
})
export default router


