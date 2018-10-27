let ModbusBuffer = {
    calloc: ffi('void *calloc(int, int)'),

    _dataBuffer: {
        init: function(profile) {
            this.profile = profile;


            this.size = profile.memory.coils + profile.memory.holdingRegisters + profile.memory.inputRegisters + profile.memory.discreteInputs;
            this.buffer = ModbusBuffer.calloc(this.size, 1);
            print("Size buffer ", this.size);
            print("Parts", JSON.stringify(profile.memory));

            this.coils = DataView.create(this.buffer, 0, profile.memory.coils);

            this.discrete = DataView.create(this.buffer, profile.memory.coils, profile.memory.discreteInputs);

            this.registers = DataView.create(this.buffer, profile.memory.coils + profile.memory.discreteInputs, profile.memory.holdingRegisters);

            this.inputRegisters = DataView.create(this.buffer,  profile.memory.coils + profile.memory.discreteInputs + profile.memory.holdingRegisters, profile.memory.inputRegisters);
            
            this.offset = 0;
            this.le = false;
        },

        getCoil: function(address) {
            return this.coils.getUint8(address - this.offset);
        },

        setCoil: function(address, value) {
            return this.coils.setUint8(address - this.offset, value);
        },
        
        getDiscrete: function(address) {
            return this.discrete.getUint8(address - this.offset);
        },

        setDiscrete: function(address, value) {
            return this.discrete.setUint8(address - this.offset, value);
        },

        getHoldingRegisterUint16: function(address) {
            return this.registers.getUint16(address - this.offset, this.le);
        },

        getInputRegisterUint16: function(address) {
            return this.inputRegisters.getUint16(address - this.offset, this.le);
        },
        
        setUint16: function(address, value, le) {
            return this.dataView.setUint16(address - this.offset, value, le);
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
        
        print("edge loaded", content);
        let edge = JSON.parse(content);
        print("loaded edge ", edge.id);
        Registry.edge = edge;
    
        // for (let i =0; i < edge.modbus.length; i++) {
        //     let slaveInfo = edge.modbus[i];
        //     print("device id", slaveInfo.deviceId);
        //     print("slave id", slaveInfo.slaveId);
        //     Registry.loadProfile(slaveInfo.deviceId);
        // }
        
        // Registry.init();
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
        
        print("edge loaded", content);
        let edge = JSON.parse(content);    
        for (let i =0; i < edge.modbus.length; i++) {
            let slaveInfo = edge.modbus[i];
            Registry.deleteProfile(slaveInfo.deviceId);
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
      let config =  {
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
    };


    for (let i =0; i < Registry.edge.modbus.length; i++) {
        let slaveInfo = Registry.edge.modbus[i];
        print("device id", slaveInfo.deviceId);
        print("slave id", slaveInfo.slaveId);
        Registry.loadProfile(slaveInfo.deviceId);
    }
    
    

    let deviceBuffers = [];
       
    for (let i = 0; i < Registry.edge.modbus.length; i++) {
          let slaveInfo =  Registry.edge.modbus[i];

          print("finding profile");
         //let profile = Registry.findProfile(slaveInfo.deviceId);

         let index = -1;

         for (let k = 0; k < Registry.profiles.length; k++) {
            if (Registry.profiles[k].id === slaveInfo.deviceId) {
                index = k;
                break;
            }
         }


        if (index > -1) {

            print("Creating buffer");
            let deviceBuffer = ModbusBuffer.create(Registry.profiles[index]);
            deviceBuffer.deviceId = slaveInfo.slaveId;

            deviceBuffers.push(deviceBuffer);
            //FIXME: need to maintain deviceId

            print("Done Creating buffer");
            //print("Creating device ", slaveInfo.slaveId);
            
            //print("Device Added ", slaveInfo.slaveId);
            
        }
    }

    let  slave = Object.create(ModbusSlave);
     
     slave.init(deviceBuffers);
     
    //print("Adding Device ", slaveInfo.slaveId);
    RS485.slaveRTU = slave;
    slave.serial = RS485;
    
    //Registry.profiles = [];
    //Registry.edge = null;
    print("loadModbus Exit");
  }
};