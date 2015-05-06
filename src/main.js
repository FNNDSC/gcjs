require.config({
  baseUrl: 'js/components',
  paths: {
    fmjs: 'fmjs/src/js/fmjs',
    gcjs: '../gcjs'
  }
});


require(['gcjs'], function(gcjs) {

  var CLIENT_ID = '358010366372-o8clkqjol0j533tp6jlnpjr2u2cdmks6.apps.googleusercontent.com';
  var driveFm = new gcjs.GDriveCollab(CLIENT_ID);

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
  main();

});
