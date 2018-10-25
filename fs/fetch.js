let Fetch = {
    getJson: function (url, callback, userDef) {
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
                 print(err); 
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
        Fetch.getJson('http://192.168.2.6:7777/api/edges/' + id, 
                   function(err, data, ud) {
                      print("Got callback ", data);
                      File.write(JSON.stringify(data), "edge.json");
                      for (let i =0; i < data.devices.length; i++) {
                        let deviceId = data.devices[i];
                        print("device id", deviceId);
                        Fetch.fetchDevice(deviceId);
                      }
                   }
        );
      },

    fetchProfile: function(id) {
        Fetch.getJson('http://192.168.2.6:7777/api/profiles/' + id, 
                   function(err, data, ud) {
                      print("Got profile callback ", data);
                      File.write(JSON.stringify(data), "profile-" + data.id + ".json");
                      
                    //   for (let i =0; i < data.devices.length; i++) {
                    //     let deviceId = data.devices[i];
                    //     print("device id", deviceId);
                    //   }
                   }
        );
    },

    fetchDevice: function(id) {
        Fetch.getJson('http://192.168.2.6:7777/api/devices/' + id, 
                   function(err, data, ud) {
                      print("Got device callback ", data);
                      File.write(JSON.stringify(data), "device-" + data.id + ".json");
                      Fetch.fetchProfile(data.id);
                    //   for (let i =0; i < data.devices.length; i++) {
                    //     let deviceId = data.devices[i];
                    //     print("device id", deviceId);
                    //   }
                   }
        );
      }
};

