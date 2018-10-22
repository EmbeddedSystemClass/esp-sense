let TemperatureMeter = {
    config: {
        coils: {
          offset: 0,
          size: 20
        },
        discreteInputs: {
          offset: 0,
          size: 20,
          le: false
        },
        holdingRegisters: {
          offset: 0,
          size: 100,
          le: false
        },
        inputRegisters: {
          offset: 0,
          size: 20,
          le: false
        }
    },

    profile: [
      {
        name: "TemperatureC",
        location: MODBUS_HOLDING_REGISTERS,
        mode: READ,
        dataType: INT16,
        address: 1,
        value: 11
      },
      {
        name: "TemperatureF",
        location: MODBUS_HOLDING_REGISTERS,
        mode: READ,
        dataType: INT16,
        address: 4,
        value: 33
      },
    
      {
        name: "RelHumidity", 
        location: MODBUS_HOLDING_REGISTERS,
        mode: READ,
        dataType: INT32,
        address: 8,
        value: 20
      },
      {
        name: "AbsHumidity", 
        location: MODBUS_HOLDING_REGISTERS,
        mode: READ,
        dataType: INT32,
        address: 12,
        value: 22
      },
      {
        name: "DewPointC", 
        location: MODBUS_HOLDING_REGISTERS,
        mode: READ,
        dataType: INT32,
        address: 16,
        value: 28
      },
      {
        name: "DewPointF", 
        location: MODBUS_HOLDING_REGISTERS,
        mode: READ,
        dataType: INT32,
        address: 20,
        value: 32
      },
      {
        name: "MixingRation", 
        location: MODBUS_HOLDING_REGISTERS,
        mode: READ,
        dataType: INT32,
        address: 24,
        value: 15
      }
      ,
      {
        name: "AirPressure", 
        location: MODBUS_HOLDING_REGISTERS,
        mode: READ,
        dataType: INT32,
        address: 28,
        value: 22
      }
    ],

    _Meter: {
      
      init: function(deviceId, config) {
        this.slave = Object.create(ModbusSlave);
        this.slave.deviceId = deviceId;

        this.slave.init(config);
        this.slave.setProfile(TemperatureMeter.profile);
        this.slave.initDefaultValues();

        Timer.set(5000 /* milliseconds */, Timer.REPEAT, function(that) {
          
          let temp = 30 + Math.floor(Math.random() * 10);
           

          print(' Temp Meter : ', + that.slave.deviceId,temp);

          that.slave.setHoldingRegister(1, temp);
           

        }, this);

      }

    },

    create: function(deviceId) {
      let device =  Object.create(TemperatureMeter._Meter); 
      device.init(deviceId, TemperatureMeter.config);
      return device;
    }
};
