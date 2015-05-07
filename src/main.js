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
  var nCollabButton = document.getElementById('newcollabbutton');
  var scene = {data: 'data'};

  nCollabButton.onclick = function() {
    var nCollabDiv = document.getElementById('newcollabdiv');
    var nRoom = document.getElementById('newroomlabel');
    var authButton = document.getElementById('authorizebutton');
    var collab = new gcjs.GDriveCollab(CLIENT_ID);

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
          collab.authorizeAndLoadApi(false, function(granted) {
            if (granted) {
              // realtime API ready.
              authButton.style.display = 'none';
              collab.startRealtimeCollaboration(scene);
            }
          });
        }
      }
    });

    collab.onConnect = function(fileId) {
      nRoom.innerHTML = 'room id: ' + fileId;
    };
  };

  eCollabButton.onclick = function() {
    var eCollabDiv = document.getElementById('existingcollabdiv');
    var eRoomInput = document.getElementById('existingroominput');
    var eRoomLabel = document.getElementById('existingroomlabel');
    var goButton = document.getElementById('gobutton');
    var collab = new gcjs.GDriveCollab(CLIENT_ID);

    eCollabDiv.style.display = "block";
    eRoomInput.focus();

    collab.authorizeAndLoadApi(true, function(granted) {
      if (granted) {
        // realtime API ready.
        goButton.onclick = function() {
          goButton.style.display = 'none';
          eRoomInput.style.display = 'none';
          collab.startRealtimeCollaboration(scene, eRoomInput.value);
        };
      } else {
        // show the button to start the authorization flow.
        goButton.onclick = function() {
          collab.authorizeAndLoadApi(false, function(granted) {
            if (granted) {
              // realtime API ready.
              goButton.style.display = 'none';
              eRoomInput.style.display = 'none';
              collab.startRealtimeCollaboration(scene, eRoomInput.value);
            }
          });
        }
      }
    });

    collab.onConnect = function(fileId) {
      eRoomLabel.innerHTML = 'room id: ' + fileId;
    };
  };



  /**
  * Request GDrive authorization, load the realtime Api and log current user
  * info on the console when the corresponding button is clicked
  */
  function main() {
    var authButton = document.getElementById('authorizeButton');
    var userButton = document.getElementById('userInfoButton');

    collab.authorizeAndLoadApi(true, function(granted) {
      if (granted) {
        // GDriveFileManager authorized and API ready.
        userButton.style.display = 'block';
        userButton.onclick = showUserInfo;
      } else {
        // show the button to start the authorization flow.
        authButton.style.display = 'block';
        authButton.onclick = function() {
          driveFm.requestFileSystem(false, function(granted) {
            if (granted) {
              // GDriveFileManager authorized and API ready.
              authButton.style.display = 'none';
              userButton.style.display = 'block';
              userButton.onclick = showUserInfo;
            }
          });
        }
      }
    });
  }

  /**
  * Show current user info on the console
  */
  function showUserInfo() {
    driveFm.getUserInfo(function(user) {
      console.log(user);
    });
  }

  // Entry point
  //main();

});
