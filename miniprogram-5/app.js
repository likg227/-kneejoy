App({
  onLaunch: function () {
    wx.cloud.init({
      env: "test-ecfan"
    })
  }
})