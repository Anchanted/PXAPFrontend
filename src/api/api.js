import axios from 'axios'
const qs = require('qs')
const api = {
  // async get (url, data) {
  //   try {
  //     let res = await axios.get(url, {params: data})
  //     res = res.data
  //     return new Promise((resolve) => {
  //       if (res.code === 0) {
  //         resolve(res)
  //       } else {
  //         resolve(res)
  //       }
  //     })
  //   } catch (err) {
  //     alert('服务器出错')
  //     console.log(err)
  //   }
  // },
  // async post (url, data) {
  //   try {
  //     let res = await axios.post(url, qs.stringify(data))
  //     res = res.data
  //     return new Promise((resolve, reject) => {
  //       if (res.code === 0) {
  //         resolve(res)
  //       } else {
  //         reject(res)
  //       }
  //     })
  //   } catch (err) {
  //     // return (e.message)
  //     alert('服务器出错')
  //     console.log(err)
  //   }
  // },
  get: function(url,params){
    return new Promise((resolve,reject) => {
      axios.get(url,{
        params:params
      })
      .then((response) => {
        resolve( response.data );
      })
      .catch((err) => {
        reject( err );
      });
    })
  },
  post: function(url,params){
    return new Promise((resolve,reject) => {
      axios.post(url,params)
      .then((response) => {
        resolve( response.data );
      })
      .catch((err) => {
        reject( err );
      });
    })
  }
}
export default api
