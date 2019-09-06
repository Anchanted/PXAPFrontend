import api from '@/assets/js/http'
import { appendFile } from 'fs';

const floor = {
  getFloorInfo (buildingId, floorId) {
    if (floorId) return api.get(`/floor/${buildingId}/${floorId}`)
    else return api.get(`/floor/${buildingId}`)
  }
}

export default floor
