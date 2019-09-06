import api from '@/assets/js/http'

const building = {
  getBuildingInfo (id) {
    return api.get(`/building/${id}`)
  },

  getBuildings () {
    return api.get('/building/')
  }
}

export default building
