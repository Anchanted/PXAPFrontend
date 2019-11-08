import Vue from 'vue'
import Router from 'vue-router'
import PageNotFound from '@/pages/404'
import Place from '@/pages/Place'
import SearchTop from '@/pages/Search/SearchTop'
import SearchMore from '@/pages/Search/SearchMore'
import OriginalMap from '@/pages/deprecated/OriginalMap'
import CheckMap from '@/pages/deprecated/CheckMap'
import TimetableForm from '@/pages/deprecated/TimetableForm'
import TimetableCheck from '@/pages/deprecated/TimetableTest2'
import CanvasMap from '@/pages/CanvasMap'

import store from '@/store'

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
    name: 'Map',
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
      }
    ],
  }
]

const router = new Router({
  routes,
  mode: 'history',
  base: '/pxap/'
})

router.beforeEach((to, from, next) => {
  if (to.params.buildingId && !to.params.floorId) next({ name: 'PageNotFound' })
  else {
    if (to.name !== 'OriginalMap') {
      const fromBuildingId = from.params.buildingId || ''
      const fromFloorId = from.params.floorId || ''
      const toBuildingId = to.params.buildingId || ''
      const toFloorId = to.params.floorId || ''
      if (`b${fromBuildingId}f${fromFloorId}` !== `b${toBuildingId}f${toFloorId}` || to.name === "Map") { // go to another page
        store.dispatch('commitModalCollapsed', true)
        store.dispatch('commitPanelCollapsed', false)
      }

      if (to.matched.length > 1) {
        if (to.name.indexOf('Search') !== -1) store.commit('setGlobalText', decodeURIComponent(to.query.q || ''))
        else if (to.name === 'Place') store.commit('setGlobalText', to.params.itemName || '')

        store.dispatch('commitModalCollapsed', false)
        store.dispatch('commitPanelCollapsed', false)
      }
    }
    next()
  }
})

export default router


