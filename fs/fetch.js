let Fetch = {
   apiEndPoint: "http://iiot.nodesense.ai:7777",
   //apiEndPoint: "http://192.168.2.7:7777",
    downloadedUrls: [],
    getJson: function (url, callback, userDef) {
        print("Downloading ", url);
        HTTP.query({
            callback: callback,
            userDef: userDef || null,
             url: url,
            // headers: { 'X-Foo': 'bar' },     // Optional - headers
            // data: {foo: 1, bar: 'baz'},      // Optional. If set, JSON-encoded and POST-ed
             success: function(body, full_http_msg) {
               let data = JSON.parse(body);
                
               print("data fetched ", body);
               this.callback(null, data, this.userDef);
              },
             error: function(err) { 
                 print("Error ", err); 
                 this.callback(err, null, this.userDef);
              },  // Optional
           });
      },

    sync: function (url, filePath) {
        HTTP.query({
             filePath: filePath,
             url: url,
            // headers: { 'X-Foo': 'bar' },     // Optional - headers
            // data: {foo: 1, bar: 'baz'},      // Optional. If set, JSON-encoded and POST-ed
             success: function(body, full_http_msg) {
               let data = JSON.parse(body);
               File.write(body, this.filePath);
               print("File saved successfully ", this.filePath);
               print("data ", body);
               //callback(null, data);
              },
             error: function(err) { 
                 print(err); 
                // callback(err, null);
              },  // Optional
           });
      },

    fetchEdge: function(id) {
        Fetch.downloadedUrls = []; 

        Fetch.getJson(Fetch.apiEndPoint + '/micro/edges/' + id, 
                   function(err, edge, ud) {
                      print("Got callback ", edge);
                      File.write(JSON.stringify(edge), "edge.json");
                       
                      for (let i =0; i < edge.modbus.length; i++) {
                        let slaveInfo = edge.modbus[i];
                        print("device id", slaveInfo.id);
                      
                        Fetch.fetchProfile(slaveInfo.id);
                      }
                   }
        );
      },

    fetchProfile: function(id) {

        let MODBUS_COILS = 1;
        let MODBUS_INPUT_COILS = 2;
        let MODBUS_INPUT_REGISTERS = 3;
        let MODBUS_HOLDING_REGISTERS = 4;

      let apiUrl = Fetch.apiEndPoint + '/micro/profiles/' + id;

      
      for (let i = 0; i < Fetch.downloadedUrls.length; i++) {
        if (Fetch.downloadedUrls[i] === apiUrl) {
          print("Profile already in queue ", id);
          return;
        }
      }

      Fetch.downloadedUrls.push(apiUrl);


        Fetch.getJson(apiUrl, 
                   function(err, profile, ud) {
                      print("Got profile callback ", profile);
                      //let apiUrl = Fetch.apiEndPoint + '/api/profiles/' + profile.id;
                      //Fetch.downloadedUrls.push(apiUrl);

                      // profile.memory = {
                      //   coils: 0,
                      //   holdingRegisters: 0,
                      //   inputRegisters: 0,
                      //   discreteInputs: 0
                      // };
 

                      // for (let i = 0; i < profile.config.length; i++) {
                      //     let param = profile.config[i];
                      //     if (param.lt === MODBUS_COILS) {
                      //       profile.memory.coils = profile.memory.coils + 1; 
                      //     }
                      //     if (param.lt === MODBUS_INPUT_COILS) {
                      //       profile.memory.discreteInputs = profile.memory.discreteInputs + 1;
                      //     }
                      //     if (param.lt === MODBUS_INPUT_REGISTERS) {
                      //       profile.memory.inputRegisters = profile.memory.inputRegisters + 2;
                      //     }
                      //     if (param.lt === MODBUS_HOLDING_REGISTERS) {
                      //       profile.memory.holdingRegisters = profile.memory.holdingRegisters + 2;
                      //     }
                      // }
 

                      File.write(JSON.stringify(profile), "profile-" + profile.id + ".json");
                      
                    //   for (let i =0; i < data.devices.length; i++) {
                    //     let deviceId = data.devices[i];
                    //     print("device id", deviceId);
                    //   }
                   }
        );
    }
};

