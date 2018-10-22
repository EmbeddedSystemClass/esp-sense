load('api_dataview.js');
load('api_timer.js');
load('api_uart.js');
load('api_sys.js');
load('api_gpio.js');
load('api_config.js');
load('api_file.js');
load('buffer.js');
load("rs485.js");
load("modbus_slave.js");
load("energy_meter.js");

load("temperature_meter.js");
print("welcome ESP32");

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

RS485.init(serialPortConfig);


let energyMeter1 = EnergyMeter.create(1);
// let energyMeter2 = EnergyMeter.create(2);
// let energyMeter3 = EnergyMeter.create(3);
// let energyMeter4 = EnergyMeter.create(4);


RS485.addDevice(energyMeter1.slave);
// RS485.addDevice(energyMeter2.slave);
// RS485.addDevice(energyMeter3.slave);
// RS485.addDevice(energyMeter4.slave);

// let ENERGY_METERS_COUNT = 5;
// let TEMPERATURE_METERS_COUNT = 1;


// for (let i = 1; i < ENERGY_METERS_COUNT + 1; i++) {
//   let energyMeter = EnergyMeter.create(i);
//   RS485.addDevice(energyMeter.slave);
// }

// for (let i = 10; i < 10 + TEMPERATURE_METERS_COUNT; i++) {
//   let meter = TemperatureMeter.create(i);
//   RS485.addDevice(meter.slave);
// }




let energyMeterModbusProfile = [
  {
    name: "FWVersion",
    location: MODBUS_HOLDING_REGISTERS,
    mode: READ,
    dataType: INT16,
    address: 1,
    value: 11
  },
  {
    name: "HWVersion",
    location: MODBUS_HOLDING_REGISTERS,
    mode: READ,
    dataType: INT16,
    address: 15,
    value: 33
  },

  {
    name: "SerialNumber", 
    location: MODBUS_HOLDING_REGISTERS,
    mode: READ,
    dataType: INT32,
    address: 16,
    value: 500
  },

  {
    name: "WT1", 
    location: MODBUS_HOLDING_REGISTERS,
    mode: READ,
    dataType: INT32,
    address: 28,
    value: 1020
  },

  {
    name: "WT1_PARTIAL", 
    location: MODBUS_HOLDING_REGISTERS,
    mode: READWRITE,
    dataType: INT32,
    address: 30,
    value: 2000
  }
  
];

/*
slave1.setProfile(energyMeterModbusProfile);
slave1.initDefaultValues();

slave2.setProfile(energyMeterModbusProfile);
slave2.initDefaultValues();

slave3.setProfile(energyMeterModbusProfile);
slave3.initDefaultValues();
*/

Timer.set(5000 /* milliseconds */, Timer.REPEAT, function() {
   print(' RAM: ' + JSON.stringify(Sys.free_ram()));
}, null);