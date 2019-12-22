这是硬件端代码

5.0
#include <SoftwareSerial.h>
#include "edp.c"
#include <Wire.h>
#include<Arduino.h>
#include<math.h>
#define KEY  "qhwr5xf=yCIZqxfKL=yV59ObWgY="    //APIkey 
#define ID   "575223905"                          //设备ID

//#define PUSH_ID “680788”
#define PUSH_ID NULL
#define _baudrate   9600
#define _rxpin      3
#define _txpin      2
#define WIFI_UART   dbgSerial
#define DBG_UART    Serial    //调试打印串口
SoftwareSerial dbgSerial( _txpin, _rxpin ); // 软串口，调试打印
edp_pkt *pkt;
int STBY = 10;  //standby

//制冷片
int PWMA = 6;   //Speed control 
int AIN1 = 9;   //cool or heat
int AIN2 = 8;   //cool or heat

//电机
int PWMB = 5;   //Speed control
int BIN1 = 11;  //Direction
int BIN2 = 12;  //Direction

/*
* doCmdOk
* 发送命令至模块，从回复中获取期待的关键字
* keyword: 所期待的关键字
* 成功找到关键字返回true，否则返回false
*/

bool doCmdOk(String data, char *keyword)
{
  bool result = false;
  if (data != "")   //对于tcp连接命令，直接等待第二次回复
  {
    WIFI_UART.println(data);  //发送AT指令
    DBG_UART.print("SEND: ");
    DBG_UART.println(data);
    DBG_UART.println(WIFI_UART.readStringUntil('\n'));
  }
  if (data == "AT")   //检查模块存在
  {
    delay(2000);
  }
  else{
    while (!WIFI_UART.available());  // 等待模块回复
  }
  
  delay(200);
  
  if (WIFI_UART.find(keyword))   //返回值判断
  {
    DBG_UART.println("do cmd OK");
    result = true;
  }
  else
  {
    
    DBG_UART.println("do cmd ERROR");
    result = false;
  }
  while (WIFI_UART.available()) WIFI_UART.read();   //清空串口接收缓存
  delay(500); //指令时间间隔
  return result;
}
void setup()
{
  char buf[100] = {0};
  int tmp;
  pinMode(STBY,OUTPUT); //哈哈哈
  pinMode(BIN1,OUTPUT); //电机+
  pinMode(BIN2,OUTPUT); //电机-
  pinMode(PWMB,OUTPUT); //嘻嘻嘻
  pinMode(AIN1,OUTPUT); //制冷片+
  pinMode(AIN2,OUTPUT); //制冷片-
  pinMode(PWMA,OUTPUT); //嘿嘿嘿
  Serial.begin(9600);       //串口初始化
  analogReference(INTERNAL);  //调用板载1.1V基准源

  WIFI_UART.begin( _baudrate );
  DBG_UART.begin( _baudrate );
  WIFI_UART.setTimeout(3000);    //设置find超时时间
  delay(3000);
  DBG_UART.println("I am a piece of shit!");
  delay(2000);
 // while (!doCmdOk("AT", "OK"));
  //{  
//digitalWrite(8,HIGH); 
//}
  while (!doCmdOk("AT", "OK"));
  while (!doCmdOk("AT+CWMODE=3", "OK"));    //工作模式
  while (!doCmdOk("AT+CWJAP=\"Willen\",\"1520myself\"", "OK")); //wifi名称，wifi密码
  while (!doCmdOk("AT+CIPSTART=\"TCP\",\"183.230.40.39\",876", "CONNECT"));//CONNECT,Linked
  while (!doCmdOk("AT+CIPMODE=1", "OK"));           //透传模式
  while (!doCmdOk("AT+CIPSEND", ">"));              //开始发送
}
void loop()
{
 
  static int edp_connect = 0;
  bool trigger = false;
  edp_pkt rcv_pkt;
  unsigned char pkt_type;
  int i, tmp;
  char num[10];
  /* EDP 连接 */
  if (!edp_connect)
  {
    while (WIFI_UART.available()) WIFI_UART.read(); //清空串口接收缓存
    packetSend(packetConnect(ID, KEY));             //发送EPD连接包
    while (!WIFI_UART.available());                 //等待EDP连接应答
    if ((tmp = WIFI_UART.readBytes(rcv_pkt.data, sizeof(rcv_pkt.data))) > 0 )
    {
      rcvDebug(rcv_pkt.data, tmp);
      if (rcv_pkt.data[0] == 0x20 && rcv_pkt.data[2] == 0x00 && rcv_pkt.data[3] == 0x00)
      {
        edp_connect = 1;
        DBG_UART.println("EDP connected.");
      }
      else
        DBG_UART.println("EDP connect error.");
    }
    packetClear(&rcv_pkt);
  }


  //EDP控制
  while (WIFI_UART.available())
  {
    readEdpPkt(&rcv_pkt);
    if (isEdpPkt(&rcv_pkt))
    {
      pkt_type = rcv_pkt.data[0];
      switch (pkt_type)
      {
        case CMDREQ:
          char edp_command[50];
          char edp_cmd_id[40];
          long id_len, cmd_len, rm_len;
          char datastr[20];
          char val[10];
          char val2[10];
          char wd1[10];
          //int value=1;
          memset(edp_command, 0, sizeof(edp_command));
          memset(edp_cmd_id, 0, sizeof(edp_cmd_id));
          edpCommandReqParse(&rcv_pkt, edp_cmd_id, edp_command, &rm_len, &id_len, &cmd_len);
          DBG_UART.print("rm_len: ");
          DBG_UART.println(rm_len, DEC);
          delay(10);
          DBG_UART.print("id_len: ");
          DBG_UART.println(id_len, DEC);
          delay(10);
          DBG_UART.print("cmd_len: ");
          DBG_UART.println(cmd_len, DEC);
          delay(10);
          DBG_UART.print("id: ");
          DBG_UART.println(edp_cmd_id);
          delay(10);
          DBG_UART.print("cmd: ");
          DBG_UART.println(edp_command);
        
          //数据处理与应用中EDP命令内容对应
          //本例中格式为  datastream:[1/0] 
          sscanf(edp_command, "%[^:]:%s", datastr, val);
          switch(atoi(val))
          {
            case 1://加热
                heat();
                break;
            case 3://制冷
                cool();
                break;
            case 5://上调
                upturn();
                break;
            case 7://下调
                downturn();
                break;
            case 9://康复训练
                walking();
                break;
           
          }
         
          
          
          /*packetSend(distancecm);*/
          packetSend(packetDataSaveTrans(NULL, datastr, val));//将新数据值上传至数据流
          //packetSend(packetDataSaveTrans(NULL, datastr, val2));
          packetSend(packetDataSaveTrans(NULL,datastr,wd1));
          break;
        default:
          DBG_UART.print("unknown type: ");
          DBG_UART.println(pkt_type, HEX);
          break;
      }
    }
    //delay(4);
  }
  if (rcv_pkt.len > 0)
    packetClear(&rcv_pkt);
  delay(150);
  }
/*
* readEdpPkt
* 从串口缓存中读数据到接收缓存
*/
bool readEdpPkt(edp_pkt *p)
{
  int tmp;
  if ((tmp = WIFI_UART.readBytes(p->data + p->len, sizeof(p->data))) > 0 )
  {
    rcvDebug(p->data + p->len, tmp);
    p->len += tmp;
  }
  return true;
}
/*
* packetSend
* 将待发数据发送至串口，并释放到动态分配的内存
*/
void packetSend(edp_pkt* pkt)
{
  if (pkt != NULL)
  {
    WIFI_UART.write(pkt->data, pkt->len);    //串口发送
    WIFI_UART.flush();
    free(pkt);              //回收内存
  }
}
void rcvDebug(unsigned char *rcv, int len)
{
  int i;
  DBG_UART.print("rcv len: ");
  DBG_UART.println(len, DEC);
  for (i = 0; i < len; i++)
  {
    DBG_UART.print(rcv[i], HEX);
    DBG_UART.print(" ");
  }
  DBG_UART.println("");
}

//硬件功能的代码实现
void upturn()                                        //上调角度
{ 
  digitalWrite(STBY,HIGH);
  boolean inPina=LOW;
  boolean inPinb=HIGH;
  digitalWrite(BIN1,inPina);
  digitalWrite(BIN2,inPinb);
  analogWrite(PWMB,200);
  delay(2000);//转两秒
  digitalWrite(BIN1,LOW);//停止
  digitalWrite(BIN2,LOW);
}
void downturn()                                      //下调角度
{
  digitalWrite(STBY,HIGH);
  boolean inPina=HIGH;
  boolean inPinb=LOW;
  digitalWrite(BIN1,inPina);
  digitalWrite(BIN2,inPinb);
  analogWrite(PWMB,200);
  delay(2000);//转两秒
  digitalWrite(BIN1,LOW);//停止
  digitalWrite(BIN2,LOW);
}
void walking()                                       //模拟行走
{
  digitalWrite(STBY,HIGH);
  
  digitalWrite(BIN1,HIGH);
  digitalWrite(BIN2,LOW);
  delay(1000);
  digitalWrite(BIN1,LOW);
  digitalWrite(BIN2,HIGH);
  delay(1000);
  digitalWrite(BIN1,HIGH);
  digitalWrite(BIN2,LOW);
  delay(3000);
  digitalWrite(BIN1,LOW);
  digitalWrite(BIN2,HIGH);
  delay(3000);
  digitalWrite(BIN1,HIGH);
  digitalWrite(BIN2,LOW);
  delay(4000);
  digitalWrite(BIN1,LOW);
  digitalWrite(BIN2,HIGH);
  delay(4000);
  digitalWrite(BIN1,LOW);
  digitalWrite(BIN2,LOW);
}
void heat()                                          //热敷
{
  double tem1=getTemp();
  if(tem1<41.0)
  {
  digitalWrite(STBY,HIGH);
  boolean inPin1 = LOW;
  boolean inPin2 = HIGH;
  digitalWrite(AIN1,inPin1);
  digitalWrite(AIN2,inPin2); 
  analogWrite(PWMA,255);
  }
  else
  {
    stopp();
  }
}
void cool()                                          //冷敷
{
  double tem2=getTemp();
  if(tem2>3.0)
  {
  digitalWrite(STBY,HIGH);
  boolean inPin1 = HIGH;
  boolean inPin2 = LOW;
  digitalWrite(AIN1,inPin1);
  digitalWrite(AIN2,inPin2); 
  analogWrite(PWMA,255);
  }
  else
  {
    stopp();
  }
}
int getTemp()                                       //获取温度
{
  double analogVotage = 1.1*(double)analogRead(A3)/1024.0;
  double temp = 100*analogVotage; //计算温度
  Serial.print("Temp: ");  Serial.print(temp);
  return temp;
}
void stopp()                                         //给爷停
{
  digitalWrite(STBY,LOW);
  digitalWrite(AIN1,LOW);
  digitalWrite(AIN2,LOW); 
}
