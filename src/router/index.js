import Vue from 'vue'
import Router from 'vue-router'
import CampusMap from '@/pages/CampusMap'
import BuildingMap from '@/pages/BuildingMap'
import Description from '@/pages/Description'
import OriginalMap from '@/pages/OriginalMap'
import AMap from '@/pages/AMap'

Vue.use(Router)

const routes = [
  { path: '/', component: CampusMap, name: 'Campus' },
  // { path: '/', component: OriginalMap, name: 'OriginalMap' },
  { path: '/building', component: BuildingMap, name: 'Building' },
  { path: '/description', component: Description, name: 'Description' }
]

export const router = new Router({
  routes,
  mode: 'history'
})

