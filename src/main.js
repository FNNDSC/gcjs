require.config({
  baseUrl: 'js/components',
  paths: {
    gapi: 'https://apis.google.com/js/api',
    fmjs: 'fmjs/src/js/fmjs',
    gcjs: '../gcjs'
  }
});


require(['fmjs', 'gcjs'], function(fmjs, gcjs) {

  var CLIENT_ID = '1050768372633-ap5v43nedv10gagid9l70a2vae8p9nah.apps.googleusercontent.com';
  var eCollabButton = document.getElementById('existingcollabbutton');
  var eRoomLabel = document.getElementById('existingroomlabel');
  var nCollabButton = document.getElementById('newcollabbutton');
  var nRoomLabel = document.getElementById('newroomlabel');
  var scene = {data: 0};
  var collab = new gcjs.GDriveCollab(CLIENT_ID);
  var dataFileArr = [];

  /**
   * Request GDrive authorization and load the realtime Api, hide authorization button
   * and start the collaboration on the scene object as the room owner
   */
  nCollabButton.onclick = function() {
    var nCollabDiv = document.getElementById('newcollabdiv');
    var authButton = document.getElementById('authorizebutton');

    nCollabDiv.style.display = "block";

    collab.authorizeAndLoadApi(true, function(granted) {
      if (granted) {
        // realtime API ready.
        authButton.style.display = 'none';
        collab.startRealtimeCollaboration(scene);
      } else {
        // show the button to start the authorization flow.
        authButton.style.display = 'block';
        authButton.onclick = function() {
          collab.authorizeAndLoadApi(false, function(granted2) {
            if (granted2) {
              // realtime API ready.
              authButton.style.display = 'none';
              collab.startRealtimeCollaboration(scene);
            }
          });
        }
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

    collab.authorizeAndLoadApi(true, function(granted) {
      if (granted) {
        // realtime API ready.
        goButton.onclick = function() {
          goButton.style.display = 'none';
          eRoomInput.style.display = 'none';
          collab.joinRealtimeCollaboration(eRoomInput.value);
        };
      } else {
        // show the button to start the authorization flow.
        goButton.onclick = function() {
          collab.authorizeAndLoadApi(false, function(granted2) {
            if (granted2) {
              // realtime API ready.
              goButton.style.display = 'none';
              eRoomInput.style.display = 'none';
              collab.joinRealtimeCollaboration(eRoomInput.value);
            }
          });
        }
      }
    });
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


  // This method is called when the collaboration has started and is ready
  collab.onConnect = function(fileId) {
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
    if (collab.collabOwner) {
      nRoomLabel.innerHTML = 'room id: ' + fileId;
      this.driveFm.createPath(this.dataFilesBaseDir, function() {
        for (var i=0; i<dataFileArr.length; i++) {
          loadFile(dataFileArr[i]);
        }
      });
    } else {
      eRoomLabel.innerHTML = 'room id: ' + fileId;
    }

    // Start a chat session
    var chatTextarea = document.getElementById('chattextarea');
    var text = 'Has connected';
    chatTextarea.innerHTML += '&#xA;' + collab.collaboratorInfo.mail + ': ' + text;
    collab.sendChatMsg('Has connected');
  };

  // This method is called when a new chat msg is received
  collab.onNewChatMessage = function(msgObj) {
    var chatTextarea = document.getElementById('chattextarea');
    var text = msgObj.user + ': ' + msgObj.msg;
    chatTextarea.innerHTML += '&#xA;' + text;
  }

  // This method is called when the collaboration owner has shared all data files with this collaborator
  collab.onDataFilesShared = function(collaboratorInfo, fObjArr) {

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



  // Event handler for the send msg button
  var msgBtn = document.getElementById('msgbutton');
  msgBtn.onclick = function() {
    var chatTextarea = document.getElementById('chattextarea');
    var chatInput = document.getElementById('chatinput');
    var text = chatInput.value;

    chatTextarea.innerHTML += '&#xA;' + collab.collaboratorInfo.mail + ': ' + text;
    collab.sendChatMsg(text);
  }


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
