require.config({
  baseUrl: 'js/components',
  paths: {
    fmjs: 'fmjs/src/js/fmjs',
    gcjs: '../gcjs'
  }
});


require(['gcjs'], function(gcjs) {

  var CLIENT_ID = '358010366372-o8clkqjol0j533tp6jlnpjr2u2cdmks6.apps.googleusercontent.com';
  var eCollabButton = document.getElementById('existingcollabbutton');
  var eRoomLabel = document.getElementById('existingroomlabel');
  var nCollabButton = document.getElementById('newcollabbutton');
  var nRoomLabel = document.getElementById('newroomlabel');
  var scene = {data: 0};
  var nCollab = new gcjs.GDriveCollab(CLIENT_ID);
  var eCollab = new gcjs.GDriveCollab(CLIENT_ID);

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
        nCollab.startRealtimeCollaboration("", scene);
      } else {
        // show the button to start the authorization flow.
        authButton.style.display = 'block';
        authButton.onclick = function() {
          nCollab.authorizeAndLoadApi(false, function(granted) {
            if (granted) {
              // realtime API ready.
              authButton.style.display = 'none';
              nCollab.startRealtimeCollaboration("", scene);
            }
          });
        }
      }
    });

  };

  // This method is called when the collaboration has started and is ready
  nCollab.onConnect = function(fileId) {

    console.log(nCollab.collabObj.data);
    nCollab.setCollabObj({data: ++nCollab.collabObj.data});
    console.log(nCollab.collabObj.data);

    nRoomLabel.innerHTML = 'room id: ' + fileId;
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
          eCollab.startRealtimeCollaboration(eRoomInput.value);
        };
      } else {
        // show the button to start the authorization flow.
        goButton.onclick = function() {
          eCollab.authorizeAndLoadApi(false, function(granted) {
            if (granted) {
              // realtime API ready.
              goButton.style.display = 'none';
              eRoomInput.style.display = 'none';
              eCollab.startRealtimeCollaboration(eRoomInput.value);
            }
          });
        }
      }
    });
  };

  // This method is called when the collaboration has started and is ready
  eCollab.onConnect = function(fileId) {
    console.log(eCollab.collabObj.data);
    eCollab.setCollabObj({data: ++eCollab.collabObj.data});
    console.log(eCollab.collabObj.data);
    eRoomLabel.innerHTML = 'room id: ' + fileId;
  };

});