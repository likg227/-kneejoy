const db = wx.cloud.database().collection("kneejoy")
let title = ""
let content = ""
Page({
  data: {

  },
  preserve() {
    db.add
      ({
        data:
        {
          title: title,
          content: content
        },
        success(res) {
          console.log("保存成功", res),
            wx.showToast({
              title: '保存成功',
              icon: 'succes',
              duration: 1000,
              mask: true
            })
        },
        fail(res) {
          console.log("保存失败", res)
          wx.showToast({
            title: '保存失败',
            icon: 'fail',
            duration: 1000,
            mask: true
          })
        }

      })
  },
  addTitle(e) {
    title = e.detail.value

  },
  addContent(e) {
    content = e.detail.value
  }
})