import api from '@/assets/js/http'

const facility = {
  getFacilityInfo (id) {
    return api.get(`/facility/${id}`)
  },
}

export default facility
