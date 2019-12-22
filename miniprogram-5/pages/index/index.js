
const app = getApp()
const apikey = 'qhwr5xf=yCIZqxfKL=yV59ObWgY='
const deviceid = '575223905'
var deviceConnected = false
const deviceInfoURL = "https://api.heclouds.com/devices/" + deviceid
const getDataStreamURL = "https://api.heclouds.com/devices/" + deviceid + "/datastreams"
const sendCommandURL = "https://api.heclouds.com/cmds"
function getDeviceInfo(that) {
  //查看设备连接状态，并刷新按钮状态
  wx.request({
    url: deviceInfoURL,
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      "api-key": apikey
    },
    data: {

    },
    success(res) {
      // console.log(res)
      if (res.data.data.online) {
        console.log("设备已经连接")
        deviceInit(that)//初始化按钮
        deviceConnected = true
      } else {
        console.log("设备还未连接")
        deviceConnected = false
      }
    },
    fail(res) {
      console.log("请求失败")
      deviceConnected = false
    },
    complete() {
      if (deviceConnected) {
        that.setData({ deviceConnected: true })
      } else {
        that.setData({ deviceConnected: false })
      }
    }
  })
}

function deviceInit(that) {
  console.log("开始初始化按钮")
  //初始化各个硬件的状态
  wx.request({
    url: getDataStreamURL,
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      "api-key": apikey
    },
    data: {

    },
    success(res) {
      for (var i = 0; i < res.data.data.length; i++) {
        var info = res.data.data[i]

        switch (info.id) {
          case "heat":
            if (info.current_value == 1) {
              that.setData({ heat_checked: true })
            } else {
              that.setData({ heat_checked: false })
            }
            break
          case "down":
            if (info.current_value == 7) {
              that.setData({ down_checked: true })
            } else {
              that.setData({ down_checked: false })
            }
            break
          case "Tempreture":
            break
          case "cold":
            if (info.current_value == 3) {
              that.setData({ cold_checked: true })
            } else {
              that.setData({ cold_checked: false })
            }
            break
          case "up":
            if (info.current_value == 5) {
              that.setData({ up_checked: true })
            } else {
              that.setData({ up_checked: false })
            }
            break
          case "Humidity":
            break
          case "recover":
              if (info.current_value == 9) {
                that.setData({ recover_checked: true })
              } else {
                that.setData({ recover_checked: false })
              }
              break
        }
      }
    }
  })
}

function control(hardware_id, switch_value) {
  // console.log("发送命令：" + hardware_id + ":{" + switch_value + "}")
  console.log("发送命令：" + hardware_id + ":" + switch_value)
  //按钮发送命令控制硬件
  wx.request({
    url: sendCommandURL + "?device_id=" + deviceid,
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      "api-key": apikey
    },
    // data: hardware_id + ":{" + switch_value + "}",      //TODO 设计自定义语言 blueled:{V}, 预感这边可能会有问题
    data: hardware_id + ":" + switch_value,
    success(res) {
      console.log("控制成功")
      console.log(res)
      // if(1) {
      //   alert("控制成功")
      // } else {
      //   alert("设备不在线")
      // }
    }
  })
}

Page({
  onLoad: function () {
    //加载时完成1.检查设备是否连接2.连接成功将数据显示在界面
    var that = this //将当前对象赋值
    getDeviceInfo(that)
  },
  onShow: function () {
    //TODO依旧有问题
    var that = this

    var timer = setInterval(function () {
      getDeviceInfo(that)
    }, 3000)
  },
  change: function (event)
   {
    var cmdData = event.detail.value == true ? 1 : 0 //修改为约定的数据
    switch (event.currentTarget.id)
     {
      case 'heat':
        console.log('加热')
        control('heat', cmdData)
        break;
      case 'cold':
        console.log('制冷')
        control('cold', cmdData+2)
        break;
      case 'up':
        console.log('上调角度')
        control('up', cmdData+4)
        break;
      case 'down':
        console.log('下调角度')
        control('down', cmdData+6)
        break;
      case 'recover':
        console.log('开始恢复运动')
        control('recover', cmdData+8)
        break;
    }
  }
})
