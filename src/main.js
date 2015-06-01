require.config({
  baseUrl: 'js/components',
  paths: {
    gapi: 'https://apis.google.com/js/api',
    fmjs: 'fmjs/src/js/fmjs',
    gcjs: '../gcjs'
  }
});


require(['fmjs', 'gcjs'], function(fmjs, gcjs) {

  var CLIENT_ID = '358010366372-ic7r5npijns67822bmgeu2v9q38fkqhb.apps.googleusercontent.com';
  var apiKey = 'AIzaSyDDOw0gfOPqWSiz-eh1zp_oBWXNPFcaaKs';
  var eCollabButton = document.getElementById('existingcollabbutton');
  var eRoomLabel = document.getElementById('existingroomlabel');
  var nCollabButton = document.getElementById('newcollabbutton');
  var nRoomLabel = document.getElementById('newroomlabel');
  var scene = {data: 0};
  var nCollab = new gcjs.GDriveCollab(CLIENT_ID, apiKey);
  var eCollab = new gcjs.GDriveCollab(CLIENT_ID, apiKey);
  var dataFileArr = [];

  /**
   * Request GDrive authorization and load the realtime Api, hide authorization button
   * and start the collaboration on the scene object as the room owner
   */
  nCollabButton.onclick = function() {
    var nCollabDiv = document.getElementById('newcollabdiv');
    var authButton = document.getElementById('authorizebutton');

    nCollabDiv.style.display = "block";

    nCollab.authorizeAndLoadApi(true, function(granted) {
      if (granted) {
        // realtime API ready.
        authButton.style.display = 'none';
        nCollab.startRealtimeCollaboration(scene);
      } else {
        // show the button to start the authorization flow.
        authButton.style.display = 'block';
        authButton.onclick = function() {
          nCollab.authorizeAndLoadApi(false, function(granted) {
            if (granted) {
              // realtime API ready.
              authButton.style.display = 'none';
              nCollab.startRealtimeCollaboration(scene);
            }
          });
        }
      }
    });

  };

  // This method is called when the collaboration has started and is ready
  nCollab.onConnect = function(fileId) {
    var self = this;
    var fObjArr = [];

    // function to load a file into GDrive
    function loadFile(fileObj) {
      var reader = new FileReader();
      var url = fileObj.url || fileObj;

      reader.onload = function() {
        self.driveFm.writeFile(self.dataFilesBaseDir + '/' + fileObj.name, reader.result, function(fileResp) {
          fObjArr.push({id: fileResp.id, url: url});
          if (fObjArr.length===dataFileArr.length) {
            // all data files have been uploaded to GDrive
            self.setDataFileList(fObjArr);
          }
        });
      };

      if (fileObj.file) {
        fileObj.name = fileObj.file.name;
        reader.readAsArrayBuffer(fileObj.file);
      } else {
        fileObj.name = url.substring(filePath.lastIndexOf('/') + 1);
        fmjs.urlToBlob(url, function(blob) {
          reader.readAsArrayBuffer(blob);
        });
      }
    }

    // a new object must be created and passed to setCollabObj because the collaboration object is immutable
    this.setCollabObj({data: ++this.getCollabObj().data});
    nRoomLabel.innerHTML = 'room id: ' + fileId;
    this.driveFm.createPath(this.dataFilesBaseDir, function() {
      for (var i=0; i<dataFileArr.length; i++) {
        loadFile(dataFileArr[i]);
      }
    });
  };

  /**
   * Request GDrive authorization and load the realtime Api, hide room id input and go
   * button and start the collaboration on the scene object as an additional collaborator
   */
  eCollabButton.onclick = function() {
    var eCollabDiv = document.getElementById('existingcollabdiv');
    var eRoomInput = document.getElementById('existingroominput');
    var goButton = document.getElementById('gobutton');


    eCollabDiv.style.display = "block";
    eRoomInput.focus();

    eCollab.authorizeAndLoadApi(true, function(granted) {
      if (granted) {
        // realtime API ready.
        goButton.onclick = function() {
          goButton.style.display = 'none';
          eRoomInput.style.display = 'none';
          eCollab.joinRealtimeCollaboration(eRoomInput.value);
        };
      } else {
        // show the button to start the authorization flow.
        goButton.onclick = function() {
          eCollab.authorizeAndLoadApi(false, function(granted) {
            if (granted) {
              // realtime API ready.
              goButton.style.display = 'none';
              eRoomInput.style.display = 'none';
              eCollab.joinRealtimeCollaboration(eRoomInput.value);
            }
          });
        }
      }
    });
  };

  // This method is called when the collaboration has started and is ready
  eCollab.onConnect = function(fileId) {
    // a new object must be created and passed to setCollabObj because the collaboration object is immutable
    this.setCollabObj({data: ++this.getCollabObj().data});
    eRoomLabel.innerHTML = 'room id: ' + fileId;
  };


  eCollab.onDataFilesShared = function(collaboratorInfo, fObjArr) {

    var logFileData = function(url, fileData) {

      console.log('File meta:  ', fileData.meta);
      console.log('File url:  ', url);
      if (strEndsWith(fileData.meta.title, ['json'])) {
        console.log('File data:  ', JSON.parse(fileData.data));
      } else {
        console.log('File data:  ', fmjs.str2ab(fileData.data));
      }
    }

    if (this.collaboratorInfo.mail === collaboratorInfo.mail) {
      for (var i=0; i<fObjArr.length; i++) {
        var url = fObjArr[i].url;
        // logFileData.bind(null, url)); allows to bind first arg of logFileData to fixed url
        // effectively becoming a new callback with a single fileData argument
        this.driveFm.readFileByID(fObjArr[i].id, logFileData.bind(null, url));
      }
    }
  };


    // Event handler for the directory loader button
  var dirBtn = document.getElementById('dirbtn');

  dirBtn.onchange = function(e) {
    var files = e.target.files;
    var fileObj;

    for (var i=0; i<files.length; i++) {
      fileObj = files[i];
      if ('webkitRelativePath' in fileObj) {
        fileObj.fullPath = fileObj.webkitRelativePath;
      } else if (!('fullPath' in fileObj)) {
        fileObj.fullPath = fileObj.name;
      }
      dataFileArr.push({
        'url': fileObj.fullPath,
        'file': fileObj
      });
    }
  };


  /**
   * Utility function. Return true if the string str ends with any of the
   * specified suffixes in arrayOfStr otherwise return false
   *
   * @param {String} input string
   * @param {Array} array of string suffixes
   */
  strEndsWith = function(str, arrayOfStr) {
    var index;

    for (var i=0; i<arrayOfStr.length; i++) {
      index = str.lastIndexOf(arrayOfStr[i]);
      if ((index !== -1) && ((str.length-index) === arrayOfStr[i].length)) {
        return true;
      }
    }
    return false;
  };

});
