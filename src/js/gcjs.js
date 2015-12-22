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
define(['fmjs'], function(fm) {

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

      // Google drive's realtime file full path
      this.realtimeFilePath = '/realtimeviewer/model/collab.realtime';

      // MIME type for the created Realtime files.
      this.REALTIME_MIMETYPE = 'application/vnd.google-apps.drive-sdk';

      // Google drive's data files' base directory
      this.dataFilesBaseDir = '/realtimeviewer/data';

      // File manager instance
      this.fileManager = new fm.GDriveFileManager(clientId);

      // Add permissions to send emails on behalf of the user
      this.fileManager.SCOPES.push('https://www.googleapis.com/auth/gmail.send');

      // Realtime collaboration model
      this.model = null;

      // Realtime collaboration document
      this.doc = null;

      // Whether the realtime collaboration is currently on
      this.collabIsOn = false;

      // Whether the realtime file was created by this user
      this.collabOwner = false;

      // Current collaborator's information (realtime id, name, email)
      this.collaboratorInfo = {id: "", name: "", mail: ""};
    };

    /**
     * Check if the current user has authorized the application and then load the GDrive Realtime API
     *
     * @param {Boolean} whether or not to open a popup window for OAuth 2.0 authorization.
     * @param {Function} callback whose argument is a boolean true if success
     */
     gcjs.GDriveCollab.prototype.authorizeAndLoadApi = function(immediate, callback) {

       this.fileManager.requestFileSystem(immediate, function(granted) {

         if (granted) {

           // GDrive FS granted then load the realtime API and the Gmail API if not already loaded
           gapi.load('drive-realtime', function() {

             gapi.client.load('gmail', 'v1', function() {

               callback(true);
             });
           });

         } else {

           callback(false);
         }
       });
    };

    /**
     * Create a realtime file in GDrive.
     *
     * @param {String} file's path.
     * @param {Function} optional callback whose argument is the file response object.
     */
     gcjs.GDriveCollab.prototype.createRealtimeFile = function(filePath, callback) {

       this.fileManager.createFile(filePath, this.REALTIME_MIMETYPE, function(fileResp) {

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
         self.createRealtimeFile(self.realtimeFilePath, function(fileResp) {

           var perms = {
             'value': '',
             'type': 'anyone',
             'role': 'writer'
           };

           self.collabOwner = true;

           self.fileManager.shareFileById(fileResp.id, perms, function() {

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
         self.realtimeFileId = fileId;
         gapi.drive.realtime.load(fileId, onFileLoaded, initializeModel, handleErrors);
       }
    };

    /**
     * Leave the realtime collaboration.
     */
     gcjs.GDriveCollab.prototype.leaveRealtimeCollaboration = function() {

       if (this.doc) {

         this.doc.close();
         this.realtimeFileId = '';
         this.doc = null;
         this.model = null;
         this.collabIsOn = false;
         this.collabOwner = false;
       }
     };

     /**
      * Send an email with the realtime file Id in the subject (empty body) to possible collaborators.
      *
      * @param {Array} array of strings where each string corresponds to a collaborator's email address.
      * @param {Function} optional callback whose argument is a Gmail API response object.
      */
      gcjs.GDriveCollab.prototype.sendRealtimeFileId = function(mailArr, callback) {

        if (this.collabOwner && this.collabIsOn && mailArr.length) {

          var email = 'to: ';

          for (var i=0; i<mailArr.length-1; i++) {
            email += mailArr[i] + ', ';
          }

          // add the last recipient
          email += mailArr[mailArr.length-1] + '\n';

          email += 'subject: Collaboration room id: ' + this.realtimeFileId + '\n\n';

          email += 'Collaboration room id: ' + this.realtimeFileId + '\n\nSee you there!';

          var base64EncodedEmail = btoa(email);

          var request = gapi.client.gmail.users.messages.send({
            'userId': 'me',
            'resource': {
              'raw': base64EncodedEmail
            }
          });

          this.fileManager.execGDriveRequest(request, function(resp) {

            if (callback) { callback(resp); }
          });
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
     * Get currently connected collaborators
     *
     * @return {Array} list of currently connected collaborators.
     */
     gcjs.GDriveCollab.prototype.getCollaboratorList = function() {

       if (this.model) {
         return this.model.getRoot().get('collaboratorList').asArray();
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
     * @param {Obj} new collaborator info object.
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
         var collaborator;

         var changeCollaboratorStatus = function() {

           if (++numSharedFiles === collabDataFileList.length) {

             // all files have been shared with this collaborator so set its hasDataFilesAccess to true
             collaboratorList.set(idx, {id: collaboratorInfo.id, name: collaboratorInfo.name,
               mail: collaboratorInfo.mail, hasDataFilesAccess: true});
           }
         };

         for (var idx=0; idx<collaboratorList.length; idx++) {

           collaborator = collaboratorList.get(idx);

           if ((collaborator.id === collaboratorInfo.id) && !collaborator.hasDataFilesAccess) {
             break;
           }
         }

         if (idx<=collaboratorList.length) {

           for (var j=0; j<collabDataFileList.length; j++) {

             fileId = collabDataFileList.get(j).id;
             this.fileManager.shareFileById(fileId, perms, changeCollaboratorStatus);
           }
         }
       }
    };

    /**
     * Send a new chat message to all the collaborators.
     *
     * @param {String} message text.
     */
     gcjs.GDriveCollab.prototype.sendChatMsg = function(text) {

       if (this.model && text) {
         this.model.getRoot().get('chatList').push({user: this.collaboratorInfo.name, msg: text});
       }
    };

    /**
     * This method is called by all connected instances just after a new instance connects to the
     * collaboration session.
     *
     * @param {Obj} new collaborator info object.
     */
     gcjs.GDriveCollab.prototype.onConnect = function(collaboratorInfo) {

       console.log('onConnect NOT overwritten. ' + collaboratorInfo.name + ': has connected!');
    };

    /**
     * This method is called everytime a remote collaborator disconnects from the collaboration session.
     *
     * @param {Obj} disconnected collaborator info object.
     */
     gcjs.GDriveCollab.prototype.onDisconnect = function(collaboratorInfo) {

       console.log('onDisconnect NOT overwritten. ' + collaboratorInfo.name + ': has disconnected!');
    };

    /**
     * This method is called everytime the collaboration object is changed by a remote collaborator.
     *
     * @param {Obj} new collaboration object value.
     */
     gcjs.GDriveCollab.prototype.onCollabObjChanged = function(collabObj) {

       console.log('onCollabObjChanged NOT overwritten. Collaboration object:', collabObj);
    };

    /**
     * This method is called by all connected instances everytime the collaboration
     * owner has share all its GDrive data files with a new collaborator.
     *
     * @param {Obj} new collaborator info object.
     * @param {Array} list of shared file objects. Each object has properties id: the
     * Gdrive file id and url: the original url of the file.
     */
     gcjs.GDriveCollab.prototype.onDataFilesShared = function(collaboratorInfo, fObjArr) {

       console.log('onDataFilesShared NOT overwritten.');
       console.log('Shared collaborator info:', collaboratorInfo);
       console.log('Shared file array:', fObjArr);
    };

    /**
     * This method is called everytime a new chat message is received from a remote collaborator.
     *
     * @param {Obj} new chat message object.
     */
     gcjs.GDriveCollab.prototype.onNewChatMessage = function(msgObj) {

       console.log('onNewChatMessage NOT overwritten. New chat msg object:', msgObj);
    };

    /**
    * This function is called the first time that the Realtime model is created for a file.
    * It should be used to initialize any values of the model.
    *
    * @param model {gapi.drive.realtime.Model} the Realtime root model object.
    */
    gcjs.GDriveCollab.prototype._initializeModel = function(model) {

      var cMap = model.createMap();
      var cFileList = model.createList();
      var collaboratorList = model.createList();
      var chatList = model.createList();

      // collaborative map to hold the collaboration object,
      model.getRoot().set('collabMap', cMap);

      // collaborative list of data files to track the files uploaded to GDrive by the collaboration owner
      model.getRoot().set('collabDataFileList', cFileList);

      // collaborative list of collaborator info objects to track currently connected collaborators and
      // which of them have been given access to the data files in GDrive
      model.getRoot().set('collaboratorList', collaboratorList);

      // collaborative list of chat message objects to implement a text chat
      model.getRoot().set('chatList', chatList);
    };

    /**
     * This function is called when the Realtime file has been loaded. It should
     * be used to initialize any user interface components and event handlers
     * depending on the Realtime model.
     *
     * @param doc {gapi.drive.realtime.Document} the Realtime document.
     */
     gcjs.GDriveCollab.prototype._onFileLoaded = function(doc) {
       var self = this;

       var model = doc.getModel();
       var collabMap = model.getRoot().get('collabMap');
       var collabDataFileList = model.getRoot().get('collabDataFileList');
       var collaboratorList = model.getRoot().get('collaboratorList');
       var chatList = model.getRoot().get('chatList');

       // listen for collaborator join events
       collaboratorList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, function(event) {

         self.shareDataFiles(event.values[0]);

         if (event.isLocal) {
           self.collabIsOn = true;
         }

         // generate the onConnect event for this user
         self.onConnect(event.values[0]);
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

       // listen for collaborator removed events
       collaboratorList.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, function(event) {

         // generate the onDisconnect event for this user
         self.onDisconnect(event.values[0]);
       });


       // listen for new collaborator left events
        doc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, function(event) {

          var id = event.collaborator.sessionId;
          var collab;

          for (var i=0; i<collaboratorList.length; i++) {

            collab = collaboratorList.get(i);

            if (collab.id === id) {
              collaboratorList.remove(i);
              break;
            }
          }
        });

       // listen for changes on the collaboration object
       collabMap.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, function(event) {

         if (!event.isLocal) {
           self.onCollabObjChanged(collabMap.get('collabObj'));
         }
       });

       // listen for new chat message events
       chatList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, function(event) {

         if (!event.isLocal) {
           self.onNewChatMessage(event.values[0]);
         }
       });

       self.model = model;
       self.doc = doc;

       self.fileManager.getUserInfo(function(user) {

         var collaboratorInfo = {
           id: '',
           name: user.name,
           mail: user.mail,
           hasDataFilesAccess: false
         };

         // get this user realtime id
         var collabs = doc.getCollaborators();

         for (var i=0; i<collabs.length; i++) {

           if (collabs[i].isMe) {
             collaboratorInfo.id = collabs[i].sessionId;
           }
         }

         // generate a collaborator join event
         if (self.collabOwner) {
           collaboratorInfo.hasDataFilesAccess = true;
         }

         self.collaboratorInfo = collaboratorInfo;
         collaboratorList.push(collaboratorInfo);
       });
     };

    /**
     * Handle errors thrown by the Realtime API.
     */
     gcjs.GDriveCollab.prototype._handleErrors = function(e) {
       var self = this;

       if(e.type === gapi.drive.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {

         self.fileManager.authorize(true, function(granted) {

           if (granted) {
             console.log("Auth token successfuly refreshed!");
           } else {
             console.error("Could not refresh auth token!");
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
