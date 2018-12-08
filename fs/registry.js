let ModbusBuffer = {
    calloc: ffi('void *calloc(int, int)'),
    dv_alloc: ffi('void *dv_alloc(int)'),
    getInt8: ffi('int dv_get_int8(void*, int)'),
    setInt8: ffi('int dv_set_int8(void*, int, int)'),
    getInt16: ffi('int dv_get_int16(void*, int)'),
    getInt32: ffi('int dv_get_int32(void*, int)'),
    setInt16: ffi('int dv_set_int16(void*, int, int)'),
    setInt32: ffi('int dv_set_int32(void*, int, int)'),
 
    _dataBuffer: {
        init: function(profile) {
            this.profile = profile;
            this.memory = profile.memory;
            this.size = profile.memory.coils + profile.memory.holdingRegisters + profile.memory.inputRegisters + profile.memory.discreteInputs;
            this.dataBuffer = ModbusBuffer.dv_alloc(200);
            this.coilsBuf = ModbusBuffer.dv_alloc(profile.memory.coils);
            print("Align m for di",profile.memory.discreteInputs);
            this.diCoilsBuf = ModbusBuffer.dv_alloc(profile.memory.discreteInputs);
            this.holdregBuf = ModbusBuffer.dv_alloc(profile.memory.holdingRegisters);
            this.inputregBuf = ModbusBuffer.dv_alloc(profile.memory.inputRegisters);

            this.changes = [];

            for (let i = 0; i < profile.config.length || 0; i++) {
                let mc = profile.config[i];
                //For read Coils
                if(mc.lt===MODBUS_COILS){
                    print("Coils",mc.a,mc.lt,mc.v);
                    let addr=(mc.a-1);
                    ModbusBuffer.setInt8(this.coilsBuf, addr, mc.v);
                }

                //For discrete Inputs
                if(mc.lt===MODBUS_INPUT_COILS){
                    print("DIN :",mc.a,mc.lt,mc.v);
                    let addr=(mc.a-1);
                    ModbusBuffer.setInt8(this.diCoilsBuf, addr, mc.v);
                }

                //For Holding registers set 
                if (mc.lt === MODBUS_HOLDING_REGISTERS) {
                    print("HLDR:", mc.a, mc.lt, mc.v);
                    let addr = (mc.a - 1) * 2;
                    ModbusBuffer.setInt16(this.holdregBuf, addr, mc.v);
                }

               //For Input Registers
                if (mc.lt ===MODBUS_INPUT_REGISTERS) {
                    print("InputR:", mc.a, mc.lt, mc.v);
                    let addr = (mc.a - 1) * 2;
                    ModbusBuffer.setInt16(this.inputregBuf, addr, mc.v);
                }

            }
            print("----------------------------------------------");

            this.offset = 0;
            this.le = false;
 
        },

        addChange: function(change) {
            this.changes.push(change);
        },

        clearChanges: function() {
            this.changes = [];
        },

        getCoil: function(address) {
            print("Coil is ",ModbusBuffer.getInt8(this.coilsBuf, address -1));
            return ModbusBuffer.getInt8(this.coilsBuf, address - 1);
        },

        setCoil: function(address, value) {
            print("Written to coils ",value);
            return ModbusBuffer.setInt8(this.coilsBuf, address - 1, value);
        },
        
        getDiscrete: function(address) {
            print("DI is :",ModbusBuffer.getInt8(this.diCoilsBuf,address-1));
            return ModbusBuffer.getInt8(this.diCoilsBuf, address -1);
        },

        setDiscrete: function(address, value) {
            print("Written DI ",value);
            return ModbusBuffer.setInt8(this.diCoilsBuf, address -1, value);
        },

        getHoldingRegisterUint16: function(address) {
            return ModbusBuffer.getInt16(this.holdregBuf, address - this.offset);
        },
        getInputRegisterUint16: function(address) {
            return ModbusBuffer.getInt16(this.inputregBuf, address - this.offset);
        },
        setInputRegisterUint16: function(address,value) {
            let addr=(address-1)*2;
            print("Written to IR",value);
            return ModbusBuffer.setInt16(this.inputregBuf, addr,value);
        },
        
        setUint16: function(address, value) {
            return ModbusBuffer.setInt16(this.dataBuffer, address - this.offset, value);
        },
        setHoldingRegisterUint16:function(addr,val){
            let addrr = (addr - 1) * 2;
            print("Ovrride on :",ModbusBuffer.getInt16(this.holdregBuf,addrr)," of val ",val);
            ModbusBuffer.setInt16(this.holdregBuf,addrr,val);

        }

    },

    create: function(profile) {
        let buffer =  Object.create(ModbusBuffer._dataBuffer); 
        buffer.init(profile);
        return buffer;
    }
};

// device configuration
let Registry = {
    profiles: [],

    loadEdge: function () {
        let content = File.read("edge.json");
        if (!content || content === null || content === '') {
           print("No edge.json found");
           return;
        }
        let edge = JSON.parse(content);
        print("loaded edge ", edge.id);
        Registry.edge = edge;
    },

    loadProfile: function (id) {
        if (Registry.findProfile(id)) {
            return;
        }

        let content = File.read("profile-" + id + ".json");
        if (content) {
            let profile = JSON.parse(content);
            print("loaded profile ", profile.id);
            Registry.profiles.push(profile);
        }
    },

    resetEdge: function () {
        let content = File.read("edge.json");
        
        if (!content || content === null || content === '') {
           print("No edge.json found");
           return;
        }
        
        print("edge loaded");
        let edge = JSON.parse(content);    
        for (let i =0; i < edge.modbus.length; i++) {
            let slaveInfo = edge.modbus[i];
            Registry.deleteProfile(slaveInfo.id);
        }
                File.remove("edge.json");
                print("All file deleted");
                Sys.reboot(1000000);
    },

    
    deleteProfile: function (id) {
        File.remove("profile-" + id + ".json");
        print("Deleted ---->profile-" + id + ".json");
    },
 

  findProfile: function(deviceId) {
     for (let k = 0; k < Registry.profiles.length; k++) {
        if (Registry.profiles[k].id === deviceId) {
            return Registry.profiles[k];
       }
      }
    },

  loadModbus: function() {
     print("loadModbus Enter");   
     for (let i =0; i < Registry.edge.modbus.length; i++) {
        let slaveInfo = Registry.edge.modbus[i];
        Registry.loadProfile(slaveInfo.id);
      }

     let deviceBuffers = [null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null
      ];
       
      Registry.deviceBuffers =deviceBuffers;
      
     for (let i = 0; i < Registry.edge.modbus.length; i++) {
          let slaveInfo =  Registry.edge.modbus[i];
          Sys.wdt_feed();
          let index = -1;
          for (let k = 0; k < Registry.profiles.length; k++) {
              if (Registry.profiles[k].id === slaveInfo.id) {
                 index = k;
                 break;
               }   
            }

          if (index > -1) {
             //print("Creating buffer");
             let deviceBuffer = ModbusBuffer.create(Registry.profiles[index]);
             deviceBuffer.deviceId = slaveInfo.sid;  
             deviceBuffers[slaveInfo.sid] = deviceBuffer;
            }
        }
       let  slave = Object.create(ModbusSlave);  
       slave.init(deviceBuffers);    
       RS485.slaveRTU = slave;
       slave.serial = RS485;
       print("loadModbus Exit");
    }
};