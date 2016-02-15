require(['./config'], function(){
require(['fmjsPackage'], function(fm) {

  var CLIENT_ID = '1050768372633-ap5v43nedv10gagid9l70a2vae8p9nah.apps.googleusercontent.com';
  var driveFm = new fm.GDriveFileManager(CLIENT_ID);

  /**
  * Request GDrive authorization, load the GDriveFileManager Api and log current user
  * info on the console when the corresponding button is clicked
  */
  function main() {
    var authButton = document.getElementById('authorizeButton');
    var userButton = document.getElementById('userInfoButton');

    driveFm.requestFileSystem(true, function(granted) {
      if (granted) {
        // GDriveFileManager authorized and API ready.
        userButton.style.display = 'block';
        userButton.onclick = showUserInfo;
        createFile();
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
              createFile();
            }
          });
        };
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

  /**
  * Create file
  */
  function createFile() {

    /*var perms = { // share with specific user
      'value': userMail,
      'type': 'user',
      'role': 'writer'
    };*/

    var perms = { // share with everyone
      'value': '',
      'type': 'anyone',
      'role': 'writer'
    };

    driveFm.createFile('/realtimeviewer/test.realtime', 'application/vnd.google-apps.drive-sdk', function(fResp) {
      console.log(fResp);
      driveFm.shareFileById(fResp.id, perms, function(resp) {
        console.log(resp);
      });
    });
  }

  // Entry point
  main();

});

});