
Page({
  data: {
    datalist: []
  },
  getData() {
    let that = this
    wx.cloud.database().collection("kneejoy").get({
      
      success(res) {
        console.log("获取成功", res)
        that.setData({
          datalist: res.data
        })
      },
      fail(res) {
        console.log("获取失败", res)
      }
    })
  }

})