/**
 * This module takes care of implementing realtime collaboration.
 *
 * FEATURES
 * - Implements collaboration based on google drive realtime collaborative data models
 *
 * TECHNOLOGY
 * - fmjs
 * - Google drive realtime API
 */

// define a new module
define(['fmjs'], function(fmjs) {

  /**
   * Provide a namespace for the collaboration module
   *
   * @namespace
   */
  var gcjs = gcjs || {};

    /**
     * Class implementing the google drive realtime collaboration
     * Uses Google Drive Realtime API
     *
     * @constructor
     * @param {String} Client ID from the Google's developer console.
     */
    gcjs.GDriveCollab = function(clientId) {
      // MIME type for newly created Realtime files.
      this.REALTIME_MIMETYPE = 'application/vnd.google-apps.drive-sdk';
      // file manager instance
      this.driveFm = new fmjs.GDriveFileManager(clientId);
      // Has Google Drive Realtime API been loaded?
      this.driveRtApiLoaded = false;

    };

    /**
     * Check if the current user has authorized the application and then load the GDrive Realtime API
     *
     * @param {Boolean} whether or not to open a popup window for OAuth 2.0 authorization.
     * @param {Function} callback whose argument is a boolean true if success
     */
     gcjs.GDriveCollab.prototype.loadApi = function(immediate, callback) {
       var self = this;

       if (this.driveRtApiLoaded) {
         callback(true);
       } else {
         this.driveFm.requestFileSystem(immediate, function(granted) {
           if (granted) {
             // GDrive FS granted then load the realtime API
             gapi.load('drive-realtime', function() {
               self.driveRtApiLoaded = true;
               callback(true);
             });
           } else {
             callback(false);
           }
         });
       }

    };

    /**
     * Create a realtime file in GDrive
     *
     * @param {String} file's path.
     * @param {Function} optional callback whose argument is the file response object.
     */
     gcjs.GDriveCollab.prototype.createRealtimeFile = function(filePath, callback) {
       var mimeType = 'application/vnd.google-apps.drive-sdk';

       this.driveFm.createFile(filePath, mimeType, function(fileResp) {
         if (callback) {
           callback(fileResp);
         }
       });
     };

    /**
    * This function is called the first time that the Realtime model is created
    * for a file. This function should be used to initialize any values of the
    * model. In this case, we just create the single string model that will be
    * used to control our text box. The string has a starting value of 'Hello
    * Realtime World!', and is named 'text'.
    *
    * @param model {gapi.drive.realtime.Model} the Realtime root model object.
    */
    gcjs.GDriveCollab.prototype.initializeModel = function(model) {
      var string = model.createString('Hello Realtime World!');
      model.getRoot().set('text', string);
    };

    /**
     * This function is called when the Realtime file has been loaded. It should
     * be used to initialize any user interface components and event handlers
     * depending on the Realtime model. In this case, create a text control binder
     * and bind it to our string model that we created in initializeModel.
     *
     * @param doc {gapi.drive.realtime.Document} the Realtime document.
     */
     gcjs.GDriveCollab.prototype.onFileLoaded = function(doc) {
       var string = doc.getModel().getRoot().get('text');

      // Keeping one box updated with a String binder.
      var textArea1 = document.getElementById('editor1');
      gapi.drive.realtime.databinding.bindString(string, textArea1);

      // Keeping one box updated with a custom EventListener.
      var textArea2 = document.getElementById('editor2');
      var updateTextArea2 = function() {
        textArea2.value = string;
      };
      string.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, updateTextArea2);
      string.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, updateTextArea2);
      textArea2.onkeyup = function() {
        string.setText(textArea2.value);
      };
      updateTextArea2();

     };

  return gcjs;
});
