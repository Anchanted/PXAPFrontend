import api from './api'

const direction = {
  getPath (start, end) {
    return api.get(`/direction/${start}/${end}`)
  }
}

export default direction