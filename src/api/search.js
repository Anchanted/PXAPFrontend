import api from './api'

const search = {
  searchTop (params) {
    return api.get(`/search/`, params)
  },

  searchMore (placeType, params) {
    return api.get(`/search/${placeType}`, params)
  }
}

export default search
