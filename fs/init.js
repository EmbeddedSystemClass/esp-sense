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

load('buffer.js');
load('fetch.js');
load("rs485.js");

load("modbus_slave.js");
load("energy_meter.js");

load("temperature_meter.js");
print("welcome ESP32");

RPC.call(RPC.LOCAL, 'Sys.GetInfo', null, function(resp, ud) {
  //print('Response:', JSON.stringify(resp));
  print('MAC address:', resp.mac);
}, null);

Cfg.set({debug: {level: 3}});

let rs485Config = {
  baudRate: 9600,
  parity: 0,
  numStopBits: 1
};

File.write(JSON.stringify(rs485Config), "rs485.json");

 
let rs485Text = File.read("rs485.json");

let rs485 = JSON.parse(rs485Text);

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

// RS485.init(serialPortConfig);


// let energyMeter1 = EnergyMeter.create(1);
 
// RS485.addDevice(energyMeter1.slave);

// let tempMeter1 = TemperatureMeter.create(5);
// RS485.addDevice(tempMeter1.slave);
 

Timer.set(5000 /* milliseconds */, Timer.REPEAT, function() {
   print(' RAM: ' + JSON.stringify(Sys.free_ram()));

  let res = MQTT.pub('presence', JSON.stringify({ ram: Sys.free_ram(), b: 2 }), 0);
  print('Published:', res ? 'yes' : 'no');
 

}, null);


function loadProfile(id) {
  let content = File.read("profile-" + id + ".json");
  let profile = JSON.parse(content);
  print("loaded profile ", profile.id);
}

function loadDevice(id) {
  let deviceContent = File.read("device-" + id + ".json");
  let device = JSON.parse(deviceContent);
  print("loaded device ", device.id);
  loadProfile(device.id);
}

function loadEdge() {
  let edgeContent = File.read("edge.json");
  let edge = JSON.parse(edgeContent);
  print("loaded edge ", edge.id);
  for (let i =0; i < edge.devices.length; i++) {
    let deviceId = edge.devices[i];
    print("device id", deviceId);
    loadDevice(deviceId);
  }
}
 

Timer.set(10000,Timer.REPEAT,function(){
  //loadEdge();
}, null);

Timer.set(10000,Timer.REPEAT,function(){
  
  // RPC.call(RPC.LOCAL, 'Sys.GetInfo', null, function(resp, ud) {
  //   //print('Response:', JSON.stringify(resp));
  //   print('MAC address:', resp.mac);
  //   Fetch.fetchEdge(resp.mac);
  // }, null);

}, null);

let pin = 0;

GPIO.set_button_handler(pin, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
  print("Button pressed");
  RPC.call(RPC.LOCAL, 'Sys.GetInfo', null, function(resp, ud) {
    //print('Response:', JSON.stringify(resp));
    print('MAC address:', resp.mac);
    Fetch.fetchEdge(resp.mac);
  }, null);
}, null);

  // HTTP.query({
  //      url: 'http://192.168.2.6:7777/api/edges/30AEA47564F4',
  //     // headers: { 'X-Foo': 'bar' },     // Optional - headers
  //     // data: {foo: 1, bar: 'baz'},      // Optional. If set, JSON-encoded and POST-ed
  //      success: function(body, full_http_msg) {
  //        let users = JSON.parse(body);
  //        File.write(body,"settings.json");
  //        let settings =File.read("settings.json");
  //        print(settings);
  //             },
  //      error: function(err) { print(err); },  // Optional
  //    });


//    },null);


 MQTT.sub('presence', function(conn, topic, msg) {
    print('Topic:', topic, 'message:', msg);
  }, null);

  MQTT.setEventHandler(function(conn, ev, edata) {
    if (ev !== 0) print('MQTT event handler: got', ev);
    // if (edata !== 0) print('MQTT event handler: got edata', edata);
    
  }, null);