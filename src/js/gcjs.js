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

       this.driveFm.createFile(filePath, this.REALTIME_MIMETYPE, function(fileResp) {
         if (callback) {
           callback(fileResp);
         }
       });
     };

    /**
     * Start the realtime collaboration
     *
     * @param {String} Google Drive's realtime file id.
     * @param {Object} Collaboration object containing the data to be kept in sync.
     */
     gcjs.GDriveCollab.prototype.startRealtimeCollaboration = function(fileId, collabObj) {
       var self = this;

       function onFileLoaded(doc) {
         self._onFileLoaded(doc);
       }

       function initializeModel(model) {
         self._initializeModel(model);
         // the room owner initializes the realtime model with collabObj
         model.getRoot().get('collabMap').set('collabObj', collabObj);
       }

       function handleErrors(err) {
         self._handleErrors(err);
       }

       if (fileId) {
         // using existing realtime file (entering existing room)
         this.realtimeFileId = fileId;
         gapi.drive.realtime.load(fileId, onFileLoaded, initializeModel, handleErrors);
       } else if (collabObj) {
         // if there is data then create new realtime file (create new room)
         this.createRealtimeFile('/realtimeviewer/collab.realtime', function(fileResp) {
           var perms = {
             'value': '',
             'type': 'anyone',
             'role': 'writer'
           };

           self.driveFm.shareFileById(fileResp.id, perms, function() {
             self.realtimeFileId = fileResp.id;
             gapi.drive.realtime.load(fileResp.id, onFileLoaded, initializeModel, handleErrors);
           });
         });
       }
    };

    /**
     * Set the realtime collaboration object
     *
     * @param {Object} collaboration object containing the data to be kept in sync.
     */
     gcjs.GDriveCollab.prototype.setCollabObj = function(collabObj) {
       if (this.model && collabObj) {
         this.model.getRoot().get('collabMap').set('collabObj', collabObj);
       }
    };

    /**
     * Get the realtime collaboration object
     *
     * @return {Object} collaboration object that is kept in sync.
     */
     gcjs.GDriveCollab.prototype.getCollabObj = function() {
       if (this.model) {
         return this.model.getRoot().get('collabMap').get('collabObj');
       }
    };

    /**
     * Push a new collaboration file
     *
     * @param {String} new file id to be added
     */
     gcjs.GDriveCollab.prototype.collabFileListPush = function(fileId) {
       if (this.model) {
         this.model.getRoot().get('collabFileList').push(fileId);
       }
    };

    /**
     * This method is called just after starting the collaboration.
     *
     * @param {String} Google Drive's realtime file id.
     */
     gcjs.GDriveCollab.prototype.onConnect = function(fileId) {
       console.log('onConnect NOT overwritten. GDrive realtime file id: ' + fileId);
    };

    /**
     * This method is called everytime the collaboration object changes.
     *
     * @param {Obj} new collaboration object value.
     */
     gcjs.GDriveCollab.prototype.onCollabObjChange = function(collabObj) {
       console.log('onCollabObjChange NOT overwritten. Collaboration object:');
       console.log(collabObj);
    };

    /**
     * This method is called everytime the collaboration object changes.
     *
     * @param {Obj} new collaboration object value.
     */
     gcjs.GDriveCollab.prototype.onCollabFileListPush = function(fileId) {
       console.log('onCollabFileListPush NOT overwritten. New collab file id: ' + fileId);
    };

    /**
    * This function is called the first time that the Realtime model is created
    * for a file. It should be used to initialize any values of the model. In this case,
    * a collaborative map is created to hold the collaboration object and a collaborative
    * list of files is created to track the files uploaded to GDrive by the room owner.
    *
    * @param model {gapi.drive.realtime.Model} the Realtime root model object.
    */
    gcjs.GDriveCollab.prototype._initializeModel = function(model) {
      var cMap = model.createMap();
      var cFileList = model.createList();

      model.getRoot().set('collabMap', cMap);
      model.getRoot().set('collabFileList', cFileList);
    };

    /**
     * This function is called when the Realtime file has been loaded. It should
     * be used to initialize any user interface components and event handlers
     * depending on the Realtime model. In this case, we listen for the OBJECT_CHANGED
     * event on a collaborative map and for the VALUES_ADDED event on a collaborative list.
     *
     * @param doc {gapi.drive.realtime.Document} the Realtime document.
     */
     gcjs.GDriveCollab.prototype._onFileLoaded = function(doc) {
       var self = this;
       var model = doc.getModel();
       var collabMap = model.getRoot().get('collabMap');
       var collabFileList = model.getRoot().get('collabFileList');

       collabMap.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, function() {
         self.onCollabObjChange(collabMap.get('collabObj'));
       });

       collabFileList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, function(event) {
         self.onCollabFileListPush(event.values[0]);
       });

       self.model = model;
       self.onConnect(self.realtimeFileId);
     };

     /**
     * Handles errors thrown by the Realtime API.
     */
     gcjs.GDriveCollab.prototype._handleErrors = function(e) {
       var self = this;

       if(e.type === gapi.drive.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
         self.authorizeAndLoadApi(true, function(granted) {
           if (granted) {
             console.log("token succesfuly refreshed");
           } else {
             self.authorizeAndLoadApi(false, function(resp) {
               if (resp) {
                 console.log("token succesfuly refreshed");
               } else{
                 console.error("could not refresh token");
               }
             });
           }
         });
       } else if(e.type === gapi.drive.realtime.ErrorType.CLIENT_ERROR) {
         alert("An Error happened: " + e.message);
         window.location.href= "/";
       } else if(e.type === gapi.drive.realtime.ErrorType.NOT_FOUND) {
         alert("The file was not found. It does not exist or you do not have read access to the file.");
         window.location.href= "/";
       }
     };

  return gcjs;
});
