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
    * @param {String} Api key from the Google's developer console.
    */
    gcjs.GDriveCollab = function(clientId, apiKey) {

      // Google drive's realtime file id
      this.realtimeFileId = '';
      // Google drive's realtime file full path
      this.realtimeFilePath = '/realtimeviewer/model/collab.realtime';
      // MIME type for the created Realtime files.
      this.REALTIME_MIMETYPE = 'application/vnd.google-apps.drive-sdk';
      // Google drive's data files' base directory
      this.dataFilesBaseDir = '/realtimeviewer/data';
      // File manager instance
      this.driveFm = new fmjs.GDriveFileManager(clientId, apiKey);
      // Has Google Drive Realtime API been loaded?
      this.driveRtApiLoaded = false;
      // Realtime collaboration model
      this.model = null;
      // Realtime collaboration document
      this.doc = null;
      // Whether the realtime file was created by this user
      this.collabOwner = false;
      // Current collaborator's information (email)
      this.collaboratorInfo = {mail: ""};

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
     * Create a realtime file in GDrive.
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
     * Start the realtime collaboration.
     *
     * @param {Object} Collaboration object containing the data to be kept in sync.
     */
     gcjs.GDriveCollab.prototype.startRealtimeCollaboration = function(collabObj) {
       var self = this;

       function onFileLoaded(doc) {
         self._onFileLoaded(doc);
       }

       function initializeModel(model) {
         self._initializeModel(model);
         // the collaboration owner initializes the realtime model with collabObj
         model.getRoot().get('collabMap').set('collabObj', collabObj);
       }

       function handleErrors(err) {
         self._handleErrors(err);
       }

       if (collabObj) {
         // if there is data then create new realtime file (this user is the collaboration owner)
         this.createRealtimeFile(this.realtimeFilePath, function(fileResp) {
           var perms = {
             'value': '',
             'type': 'anyone',
             'role': 'writer'
           };

           self.collabOwner = true;
           self.driveFm.shareFileById(fileResp.id, perms, function() {
             self.realtimeFileId = fileResp.id;
             gapi.drive.realtime.load(fileResp.id, onFileLoaded, initializeModel, handleErrors);
           });
         });
       }
    };

    /**
     * Join a realtime collaboration.
     *
     * @param {String} Google Drive's realtime file id.
     */
     gcjs.GDriveCollab.prototype.joinRealtimeCollaboration = function(fileId) {
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
         // using existing realtime file (other user is the collaboration owner)
         this.realtimeFileId = fileId;
         gapi.drive.realtime.load(fileId, onFileLoaded, initializeModel, handleErrors);
       }
    };

    /**
     * Leave the realtime collaboration.
     */
     gcjs.GDriveCollab.prototype.leaveRealtimeCollaboration = function() {

       if (this.model) {
         if (!this.collabOwner) {
           var collaboratorList = this.model.getRoot().get('collaboratorList');

           for (var i=0; i<collaboratorList.length; i++) {
             if (collaboratorList.get(i).mail === this.collaboratorInfo.mail) {
               break;
             }
           }
           collaboratorList.remove(i);
         }
         this.doc.close();
       }
     };

    /**
     * Set the realtime collaboration object.
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
     * Set the GDrive collaboration data file object list. The passed file object array is
     * pushed into collabDataFileList. Each file object has properties id: the Gdrive file
     * id and url: the original url of the file.
     *
     * @param {Array} array of data file objects.
     */
     gcjs.GDriveCollab.prototype.setDataFileList = function(fObjArr) {

       if (this.model && this.collabOwner) {

         this.model.getRoot().get('collabDataFileList').pushAll(fObjArr);

         var collaboratorList = this.model.getRoot().get('collaboratorList');
         for (var i=0; i<collaboratorList.length; i++) {
           this.shareDataFiles(collaboratorList.get(i));
         }
       }
     };

    /**
     * Share existing data files with new collaborator.
     *
     * @param {String} new collaborator info object.
     */
     gcjs.GDriveCollab.prototype.shareDataFiles = function(collaboratorInfo) {

       if (this.model && this.collabOwner) {

         var numSharedFiles = 0;
         var perms = { // collaboration owner shares files with this collaborator
           'value': collaboratorInfo.mail,
           'type': 'user',
           'role': 'reader'
         };
         var fileId;
         var collabDataFileList = this.model.getRoot().get('collabDataFileList');
         var collaboratorList = this.model.getRoot().get('collaboratorList');

         var changeCollaboratorStatus = function() {
           if (++numSharedFiles === collabDataFileList.length) {
             // all files have been shared with this collaborator so set its hasDataFilesAccess to true
             for (var i=0; i<collaboratorList.length; i++) {
               if (collaboratorList.get(i).mail === collaboratorInfo.mail) {
                 break;
               }
             }
             collaboratorList.set(i, {mail: collaboratorInfo.mail, hasDataFilesAccess: true});
           }
         };

         for (var i=0; i<collabDataFileList.length; i++) {
           fileId = collabDataFileList.get(i).id;
           this.driveFm.shareFileById(fileId, perms, changeCollaboratorStatus);
         }
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
     gcjs.GDriveCollab.prototype.onCollabObjChanged = function(collabObj) {
       console.log('onCollabObjChanged NOT overwritten. Collaboration object:', collabObj);
    };

    /**
     * This method is called everytime the collaboration owner has share all its GDrive
     * data files with a new collaborator.
     *
     * @param {String} new collaborator info object.
     * @param {Array} list of shared file objects. Each object has properties id: the
     * Gdrive file id and url: the original url of the file.
     */
     gcjs.GDriveCollab.prototype.onDataFilesShared = function(collaboratorInfo, fObjArr) {
       console.log('onDataFilesShared NOT overwritten.');
       console.log('Shared collaborator info:', collaboratorInfo);
       console.log('Shared file array:', fObjArr);
    };

    /**
    * This function is called the first time that the Realtime model is created for a file.
    * It should be used to initialize any values of the model. In this case, a collaborative
    * map is created to hold the collaboration object, a collaborative list of data files
    * is created to track the files uploaded to GDrive by the collaboration owner and a
    * collaborative list of collaborator info objects is created to track currently connected
    * collaborators
    *
    * @param model {gapi.drive.realtime.Model} the Realtime root model object.
    */
    gcjs.GDriveCollab.prototype._initializeModel = function(model) {
      var cMap = model.createMap();
      var cFileList = model.createList();
      var collaboratorList = model.createList();

      model.getRoot().set('collabMap', cMap);
      model.getRoot().set('collabDataFileList', cFileList);
      model.getRoot().set('collaboratorList', collaboratorList);
    };

    /**
     * This function is called when the Realtime file has been loaded. It should
     * be used to initialize any user interface components and event handlers
     * depending on the Realtime model. In this case, we listen for the OBJECT_CHANGED
     * event on a collaborative map and for the VALUES_ADDED and VALUES_SET events on
     * two collaborative lists.
     *
     * @param doc {gapi.drive.realtime.Document} the Realtime document.
     */
     gcjs.GDriveCollab.prototype._onFileLoaded = function(doc) {
       var self = this;
       var model = doc.getModel();
       var collabMap = model.getRoot().get('collabMap');
       var collabDataFileList = model.getRoot().get('collabDataFileList');
       var collaboratorList = model.getRoot().get('collaboratorList');

       // listen for changes on the collaboration object
       collabMap.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, function() {
         self.onCollabObjChanged(collabMap.get('collabObj'));
       });

       // listen for new collaborator join events
       collaboratorList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, function(event) {
         self.shareDataFiles(event.values[0]);
       });

       // listen for a collaborator status change event
       // this happens when all existing owner's Gdrive data files are shared with a new collaborator
       collaboratorList.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, function(event) {
         var fObjArr = [];

         for (var i=0; i<collabDataFileList.length; i++) {
           fObjArr.push(collabDataFileList.get(i));
         }
         self.onDataFilesShared(event.newValues[0], fObjArr);
       });

       // generate the collaborator join event for this user
       if (!self.collabOwner) {
         self.driveFm.getUserInfo(function(user) {
           self.collaboratorInfo.mail = user.mail;
           collaboratorList.push({mail: user.mail, hasDataFilesAccess: false});
         });
       }

       self.model = model;
       self.doc = doc;
       // generate the onConnect event for this user
       self.onConnect(self.realtimeFileId);
     };

    /**
     * Handle errors thrown by the Realtime API.
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
