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

      // Google drive's realtime file id
      this.realtimeFileId = '';
      // MIME type for newly created Realtime files.
      this.REALTIME_MIMETYPE = 'application/vnd.google-apps.drive-sdk';
      // file manager instance
      this.driveFm = new fmjs.GDriveFileManager(clientId);
      // Has Google Drive Realtime API been loaded?
      this.driveRtApiLoaded = false;
      // Collaboration object that is kept in sync.
      this.collabObj = null;
      // Realtime collaboration model
      this.model = null;

    };

    /**
     * Check if the current user has authorized the application and then load the GDrive Realtime API
     *
     * @param {Boolean} whether or not to open a popup window for OAuth 2.0 authorization.
     * @param {Function} callback whose argument is a boolean true if success
     */
     gcjs.GDriveCollab.prototype.authorizeAndLoadApi = function(immediate, callback) {
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
     * Start the realtime collaboration
     *
     * @param {Object} Collaboration object containing the data to be kept in sync.
     * @param {String} Google Drive's realtime file id.
     */
     gcjs.GDriveCollab.prototype.startRealtimeCollaboration = function(collabObj, fileId) {
       var self = this;

       function onFileLoaded(doc) {
         self._onFileLoaded(doc);
       }

       function initializeModel(model) {
         self._initializeModel(model);
       }

       function handleErrors(err) {
         self._handleErrors(err);
       }

       if (fileId) {
         this.realtimeFileId = fileId;
         gapi.drive.realtime.load(fileId, onFileLoaded, initializeModel, handleErrors);
       } else if (collabObj) {
         this.collabObj = collabObj;
         this.createRealtimeFile('/realtimeviewer/collab.realtime', function(fileResp) {
           self.realtimeFileId = fileResp.id;
           gapi.drive.realtime.load(fileResp.id, onFileLoaded, initializeModel, handleErrors);
         });
       }
    };

    /**
     * Set the realtime collaboration object
     *
     * @param {Object} Collaboration object containing the data to be kept in sync.
     */
     gcjs.GDriveCollab.prototype.setCollabObj = function(collabObj) {
       this.model.getRoot().set('collabObj', collabObj);
       this.collabObj = collabObj;
    };

    /**
     * This method is called just after starting the collaboration.
     *
     * @param {String} Google Drive's realtime file id.
     */
     gcjs.GDriveCollab.prototype.onConnect = function(fileId) {
       console.log('onConnect NOT overwritten');
    };

    /**
    * This function is called the first time that the Realtime model is created
    * for a file. This function should be used to initialize any values of the
    * model. In this case, we just create a single object model called "collabObj".
    *
    * @param model {gapi.drive.realtime.Model} the Realtime root model object.
    */
    gcjs.GDriveCollab.prototype._initializeModel = function(model) {
      var self = this;

      if (self.collabObj) {
        model.getRoot().set('collabObj', self.collabObj);
      }
    };

    /**
     * This function is called when the Realtime file has been loaded. It should
     * be used to initialize any user interface components and event handlers
     * depending on the Realtime model. In this case, we listen for the OBJECT_CHANGED
     * event on the root.
     *
     * @param doc {gapi.drive.realtime.Document} the Realtime document.
     */
     gcjs.GDriveCollab.prototype._onFileLoaded = function(doc) {
       var self = this;
       var model = doc.getModel();

       self.model = model;
       model.getRoot().addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, function() {
         self.collabObj = model.getRoot().get('collabObj');
       });
       self.collabObj = model.getRoot().get('collabObj');
       self.onConnect(self.realtimeFileId);
     };

     /**
     * Handles errors thrown by the Realtime API.
     */
     gcjs.GDriveCollab.prototype._handleErrors = function(e) {
       if(e.type == gapi.drive.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
         authorizer.authorize();
       } else if(e.type == gapi.drive.realtime.ErrorType.CLIENT_ERROR) {
         alert("An Error happened: " + e.message);
         window.location.href= "/";
       } else if(e.type == gapi.drive.realtime.ErrorType.NOT_FOUND) {
         alert("The file was not found. It does not exist or you do not have read access to the file.");
         window.location.href= "/";
       }
     };

  return gcjs;
});
