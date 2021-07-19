import api from './api'

const place = {
  getPlaceInfo(params) {
    return api.get(`/place/`, params)
  },

  getOccupiedRoomList(floorId, params) {
    return api.get(`/place/occupied/${floorId}`, params)
  },

  getPortalList(floorId) {
    return api.get(`/place/portal/${floorId}`)
  }
}

export default place