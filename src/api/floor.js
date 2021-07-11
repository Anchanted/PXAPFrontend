import api from './api'
import { appendFile } from 'fs';

const floor = {
  getFloorData(params) {
    return api.get(`/floor/`, params)
  },

  getCampusData() {
    return api.get(`/floor/campus`)
  },

  getFloorDataPlain(buildingCode, floorIndex) {
    return api.get(`/floor/plain/${floorIndex}/${buildingCode}`)
  },
}

export default floor
