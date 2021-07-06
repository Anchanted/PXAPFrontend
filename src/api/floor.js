import api from './api'
import { appendFile } from 'fs';

const floor = {
  getFloorInfo(params) {
    return api.get(`/floor/`, params)
  },

  getCampusInfo() {
    return api.get(`/floor/campus`)
  },

  getFloorInfoPlain(buildingCode, floorIndex) {
    return api.get(`/floor/plain/${floorIndex}/${buildingCode}`)
  },
}

export default floor
