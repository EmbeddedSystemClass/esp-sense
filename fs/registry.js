// device configuration
let Registry = {
    profiles: [],

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
 
   
  loadEdge: function () {
    let content = File.read("edge.json");
    
    if (!content) {
       print("No edge.json found");
       return;
    }
  
    let edge = JSON.parse(content);
    print("loaded edge ", edge.id);
    Registry.edge = edge;

    for (let i =0; i < edge.modbus.length; i++) {
        let slaveInfo = edge.modbus[i];
        print("device id", slaveInfo.deviceId);
        print("slave id", slaveInfo.slaveId);
        Registry.loadProfile(slaveInfo.deviceId);
    }
    
    Registry.init();
  },

  findProfile: function(deviceId) {
     for (let k = 0; k < Registry.profiles.length; k++) {
        if (Registry.profiles[k].id === deviceId) {
            return Registry.profiles[k];
        }
     }
  },

 

  init: function() {
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
       
    for (let i = 0; i < Registry.edge.modbus.length; i++) {
          let slaveInfo =  Registry.edge.modbus[i];

  
         let profile = Registry.findProfile(slaveInfo.deviceId);

        if (profile) {
            print("Found profile");
            
            let  slave = Object.create(ModbusSlave);
            print("Setting slave id ", slaveInfo.slaveId);
            slave.deviceId = slaveInfo.slaveId;
            slave.init(config);
            //slave.initProfile(profile);
            RS485.addDevice(slave);
            
        }
    }
 
    Registry.profiles = [];
    Registry.edge = null;
  }
};