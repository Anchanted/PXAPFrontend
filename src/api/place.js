import api from './api'

const place = {
  getPlaceInfo (id, placeType) {
    return api.get(`/place/${id}/${placeType}`)
  }
}

export default place