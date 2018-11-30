load('api_dataview.js');
load('api_timer.js');
load('api_uart.js');
load('api_sys.js');
load('api_gpio.js');
load('api_config.js');
load('api_file.js');
load('api_rpc.js');
load('api_http.js');
load('api_mqtt.js');
load('fetch.js');
load("rs485.js");
load("modbus_slave.js");
load("registry.js");
Cfg.set({debug: {level: 3}});
Registry.loadEdge();
if (Registry.edge) {
  print("Edge Setting found");
  if (Registry.edge.enableModbus === true) {
    print("Modbus Enabled, loading modbus");

    let rs485 = Registry.edge.rs485;

    if (!rs485 || rs485 === null || rs485 === undefined) {
      print("RS 485 settings not found");
      rs485 = {
          baudRate: 19200,
          parity: 0,
          numStopBits: 1
        };
    }
    print("Baud is ", rs485.baudRate);
    print("parity is ", rs485.parity);
    print("numStopBits is ", rs485.numStopBits);
    let serialPortConfig = {
      uartNo: 2,
      controlPin: 23,
      config: {
            baudRate: rs485.baudRate,
            parity: rs485.parity,
            numStopBits: rs485.numStopBits,
            esp32: {
              gpio: {
                rx: 16,
                tx: 17
              }
            }
          }
    };
    RS485.setFlowControl(23);
    RS485.init(serialPortConfig);
    Registry.loadModbus();

    MQTT.sub('/simulate/modbus/edge/1', function(conn, topic, msg) {
      print('Topic:', topic, ' Getting edge msg:', msg);
      let data = JSON.parse(msg);
      for (let i = 0; i < data.length; i++) {
         let d = data[i];
         if (d.lt === MODBUS_COILS) {
               Registry.deviceBuffers[d.sid].setCoil(d.a, d.v);
          }
         if (d.lt === MODBUS_INPUT_COILS) {
            Registry.deviceBuffers[d.sid].setDiscrete(d.a, d.v);
          }
         if (d.lt === MODBUS_HOLDING_REGISTERS) {
            Registry.deviceBuffers[d.sid].setHoldingRegisterUint16(d.a, d.v);
          }
         if (d.lt === MODBUS_INPUT_REGISTERS) {
            Registry.deviceBuffers[d.sid].setInputRegisterUint16(d.a, d.v);
          }
        }
    }, null);
   
  } 
  else{
    print("Modbus not enabled");
  }
}
else
{
  print("Edge Setting  not found");
}
let Obj = {
  dv_alloc: ffi('void *dv_alloc(int)'), 
  dv_get_int8: ffi('int dv_get_int8(void*, int)'),
  dv_set_int8: ffi('int dv_set_int8(void*, int, int)'),
  dv_get_int16: ffi('int dv_get_int16(void*, int)'),
  dv_get_int32: ffi('int dv_get_int32(void*, int)'),
  dv_set_int16: ffi('int dv_set_int16(void*, int, int)'),
  dv_set_int32: ffi('int dv_set_int32(void*, int, int)'),
  calloc: ffi('void *calloc(int, int)')
};

Timer.set(5000 /* milliseconds */, Timer.REPEAT, function() {
  print(' Memory remains: ' + JSON.stringify(Sys.free_ram()));
  print("creating object");
  print("Obj created");
}, null);
let pin = 0;
GPIO.set_button_handler(pin, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
  print("Button pressed");
  RPC.call(RPC.LOCAL, 'Sys.GetInfo', null, function(resp, ud) {
    print('MAC address:', resp.mac);
    Fetch.fetchEdge(resp.mac);
    print("Fetch completed");
  }, null);
}, null);
 
let delpin=22;
GPIO.set_button_handler(delpin, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
  MQTT.sub('my/topic', function(conn, topic, msg) {
       print('Topic:', topic, 'message:', msg);
     }, null);
}, null);
