import Vue from 'vue'
import Router from 'vue-router'
import CampusMap from '@/pages/CampusMap'
import BuildingMap from '@/pages/BuildingMap'
import Description from '@/pages/Description'
import PageNotFound from '@/pages/404'
import Place from '@/pages/Place'
import SearchTop from '@/pages/Search/SearchTop'
import SearchMore from '@/pages/Search/SearchMore'
import OriginalMap from '@/pages/OriginalMap'
import AMap from '@/pages/AMap'
import CanvasMap from '@/pages/CanvasMap'

Vue.use(Router)

const routes = [
  {
    path: "*",
    component: PageNotFound,
    name: 'PageNotFound'
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
        path: 'place/:type([a-z]+)/:id(\\d+)',
        component: Place,
        name: 'Place',
        meta: {
          keepAlive: false,
        },
      }
    ],
  },
  // {
  //   path: '/',
  //   component: CampusMap,
  //   name: 'Campus',
  //   children: [
  //     {
  //       path: 'search',
  //       component: SearchTop,
  //       name: 'CampusSearchTop',
  //       meta: {
  //         keepAlive: true
  //       },
  //     },
  //     {
  //       path: 'search/:type(building|room|facility)',
  //       component: SearchMore,
  //       name: 'CampusSearchMore',
  //       meta: {
  //         keepAlive: false,
  //         display: true
  //       },
  //     },
  //     {
  //       path: 'place/:type([a-z]+)/:id(\\d+)',
  //       component: Place,
  //       name: 'CampusPlace',
  //       meta: {
  //         keepAlive: false,
  //       },
  //     }
  //   ],
  // },
  // {
  //   path: '/:buildingId(\\d+)/:floorId(\\d+)?',
  //   component: BuildingMap,
  //   name: 'Building',
  //   children: [
  //     {
  //       path: 'search',

  //     },
  //     {
  //       path: 'place/:type([a-z]+)/:id(\\d+)',
  //       component: Place,
  //       name: 'BuildingPlace'
  //     }
  //   ],
  // },
  // { path: '/description', component: Description, name: 'Description' }
  // { path: '/', component: OriginalMap, name: 'OriginalMap' },
]

const router = new Router({
  routes,
  mode: 'history'
})

router.beforeEach((to, from, next) => {
  if (to.params.buildingId && !to.params.floorId) next({ name: 'PageNotFound' })
  else next()
})

export default router


