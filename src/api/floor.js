import api from './api'
import { appendFile } from 'fs';

const floor = {
  getFloorInfo(floorId, buildingId) {
    if (floorId) return api.get(`/floor/${floorId}/${buildingId}`)
    else return api.get(`/floor/${buildingId}`)
  },

  getCampusInfo() {
    return api.get(`/floor/campus`)
  },

  getFloorInfoPlain(floorIndex, buildingCode) {
    return api.get(`/floor/plain/${floorIndex}/${buildingCode}`)
  },
}

export default floor
