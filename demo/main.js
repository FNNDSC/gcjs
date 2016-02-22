require(['./config'], function() {

  require(['utiljsPackage', 'gcjsPackage'], function(util, gc) {

    var CLIENT_ID = '1050768372633-ap5v43nedv10gagid9l70a2vae8p9nah.apps.googleusercontent.com';
    var eCollabButton = document.getElementById('existingcollabbutton');
    var eRoomLabel = document.getElementById('existingroomlabel');
    var nCollabButton = document.getElementById('newcollabbutton');
    var nRoomLabel = document.getElementById('newroomlabel');
    var scene = {data: 0};
    var collab = new gc.GDriveCollab(CLIENT_ID);
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
          };
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
          };
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


    // This method is called by all connected instances just after a new instance connects to the
    // collaboration session
    collab.onConnect = function(collaboratorInfo) {
      var self = this;

      var fObjArr = [];

      // function to load a file into GDrive
      function loadFile(fileObj) {

        var reader = new FileReader();
        var url = fileObj.url || fileObj;

        reader.onload = function() {

          self.fileManager.writeFile(self.dataFilesBaseDir + '/' + fileObj.name, reader.result, function(fileResp) {

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

          fileObj.name = url.substring(url.lastIndexOf('/') + 1);

          util.urlToBlob(url, function(blob) {
            reader.readAsArrayBuffer(blob);
          });
        }
      }

      if (this.collaboratorInfo.id === collaboratorInfo.id) {

        // a new object must be created and passed to setCollabObj because the collaboration object is immutable
        this.setCollabObj({data: ++this.getCollabObj().data});

        if (this.collabOwner) {

          document.getElementById('mailcontainer').style.display = 'block';
          document.getElementById('mailtextarea').value = "Enter a collaborator's email address per line:";

          nRoomLabel.innerHTML = 'room id: ' + this.realtimeFileId;

          this.fileManager.createPath(this.dataFilesBaseDir, function() {

            for (var i=0; i<dataFileArr.length; i++) {
              loadFile(dataFileArr[i]);
            }
          });

        } else {

          eRoomLabel.innerHTML = 'room id: ' + this.realtimeFileId;
        }

        // Start a chat session
        var chatTextarea = document.getElementById('chattextarea');
        var text = 'Has connected';
        chatTextarea.innerHTML += '&#xA;' + this.collaboratorInfo.name + ': ' + text;
        this.sendChatMsg('Has connected');

      } else {

        console.log(collaboratorInfo.name + ' has connected');
      }

      console.log('Current collaborators: ', this.getCollaboratorList());
      console.log('I am: ', this.collaboratorInfo.id);
    };

    // This method when a remote collaborator instance disconnects from the collaboration session
    collab.onDisconnect = function(collaboratorInfo) {

      var chatTextarea = document.getElementById('chattextarea');
      var text = 'Has disconnected';

      chatTextarea.innerHTML += '&#xA;' + collaboratorInfo.name + ': ' + text;

      console.log(collaboratorInfo.name + ' has disconnected');
      console.log('Current collaborators: ', this.getCollaboratorList());
      console.log('I am: ', this.collaboratorInfo.id);
    };

    // This method is called when a new chat msg is received from a remote collaborator
    collab.onNewChatMessage = function(msgObj) {

      var chatTextarea = document.getElementById('chattextarea');
      var text = msgObj.user + ': ' + msgObj.msg;

      chatTextarea.innerHTML += '&#xA;' + text;
    };

    // This method is called by all connected instances when the collaboration owner has shared
    // all data files with this collaborator
    collab.onDataFilesShared = function(collaboratorInfo, fObjArr) {

      var logFileData = function(url, fileData) {

        console.log('File data:  ', fileData);
        console.log('File url:  ', url);
      };

      if (this.collaboratorInfo.id === collaboratorInfo.id) {

        for (var i=0; i<fObjArr.length; i++) {

          var url = fObjArr[i].url;

          // logFileData.bind(null, url)); allows to bind first arg of logFileData to fixed url
          // effectively becoming a new callback with a single fileData argument
          this.fileManager.readFileByID(fObjArr[i].id, logFileData.bind(null, url));
        }
      }
    };


    // Event handler for the send msg button
    var msgBtn = document.getElementById('msgbutton');

    msgBtn.onclick = function() {

      var chatTextarea = document.getElementById('chattextarea');
      var chatInput = document.getElementById('chatinput');
      var text = chatInput.value;

      chatTextarea.innerHTML += '&#xA;' + collab.collaboratorInfo.name + ': ' + text;
      collab.sendChatMsg(text);
    };

    // Event handler for the send mail button
    var sendmailBtn = document.getElementById('sendmailbutton');

    sendmailBtn.onclick = function() {

      function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        return re.test(email);
      }

      var mailTextarea = document.getElementById('mailtextarea');
      var mailArr = [];

      var lines = mailTextarea.value.split('\n');

      for (var i=0; i<lines.length; i++) {

        if (validateEmail(lines[i])) {
          mailArr.push(lines[i]);
        }
      }

      console.log('mailArr:', mailArr);

      // send email with room id to collaborators
      collab.sendRealtimeFileId(mailArr, function (resp) {

        console.log('resp:', resp);

        if (resp.error) {
          console.error('Could not send mail with realtime file id');
        }
      });
    };

  });
});
