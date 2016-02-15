var dependencies = [
  // BOWER DEPS
  '../../../utiljs/src/js/utiljs',
  // REMOTE DEPS
  // (NEEDS EXTENSION)
  'https://apis.google.com/js/api.js'
];

/**
 * This file manager module takes care of all file reading and saving operations
 * on diverse filesystems, including cloud uploading/downloading operations as
 * well as reading/writing the HTML5 sandboxed file system.
 *
 * FEATURES
 * - Read/write files from/to HTML5 sandboxed file system
 * - Upload/Download files from the cloud
 *
 * TECHNOLOGY
 * - HTML5 filesystem API
 * - Google drive API
 */

// define a new module
define(dependencies, function(util) {

  /**
   * Provide a namespace for the file manager module
   *
   * @namespace
   */
  var fmjs = fmjs || {};

    /**
     * Generic abstract method
     *
     * @function
     */
    fmjs.abstractmethod = function() {
      throw new Error('abstract method');
    };

    /**
     * Abstract class defining a file manager's interface
     *
     * @interface
     */
    fmjs.AbstractFileManager = function() {
      throw new Error('Can not instantiate abstract classes');
    };

    fmjs.AbstractFileManager.prototype.requestFileSystem = fmjs.abstractmethod;

    fmjs.AbstractFileManager.prototype.isFile = fmjs.abstractmethod;

    fmjs.AbstractFileManager.prototype.getFileBlob = fmjs.abstractmethod;

    fmjs.AbstractFileManager.prototype.readFile = fmjs.abstractmethod;

    fmjs.AbstractFileManager.prototype.writeFile = fmjs.abstractmethod;

    fmjs.AbstractFileManager.prototype.createPath = fmjs.abstractmethod;


    /**
     * Concrete class implementing a file manager for the local FS.
     * Currently uses the HTML5's sandboxed FS API (only implemented in Chrome)
     *
     * @constructor
     * @extends {fmjs.AbstractFileManager}
     */
    fmjs.LocalFileManager = function() {

      // local filesystem object
      this.fs = null;
    };

    /**
     * fmjs.LocalFileManager class inherits from fmjs.AbstractFileManager class
     */
    fmjs.LocalFileManager.prototype = Object.create(fmjs.AbstractFileManager.prototype);
    fmjs.LocalFileManager.prototype.constructor = fmjs.LocalFileManager;

    /**
     * Request sandboxed filesystem
     *
     * @param {Function} callback to be called when the API is ready.
     */
    fmjs.LocalFileManager.prototype.requestFileSystem = function(callback) {
      var self = this;

      // The file system has been prefixed as of Google Chrome 12:
      window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
      // Request 5GB
      /*window.webkitStorageInfo.requestQuota( PERSISTENT, 5*1024*1024*1024, function(grantedBytes) {
        window.requestFileSystem(PERSISTENT, grantedBytes, function(fs){self.fs = fs;}, self.fsErrorHandler);
      }, function(err) {
        window.console.log('Error', err);} ); */
      if (window.requestFileSystem) {
        window.requestFileSystem(window.TEMPORARY, 5*1024*1024*1024, function(fs){
          self.fs = fs;
          callback();
        }, function(err) {throw new Error('Could not grant filesystem. Error code: ' + err.code);});
      }
    };

    /**
     * Create a new directory path in the sandboxed FS
     *
     * @param {String} new absolute path to be created.
     * @param {Function} optional callback whose argument is the directory entry or
     * null otherwise.
     */
    fmjs.LocalFileManager.prototype.createPath = function(path, callback) {
      var self = this;

      function createPath() {

        function createFolder(rootDirEntry, folders) {

          function errorHandler(err) {
            window.console.log('Could not create path. Error code: ' + err.code);
            if (callback) {
              callback(null);
            }
          }

          // exclusive:false means if the folder already exists then don't throw an error
          rootDirEntry.getDirectory(folders[0], {create: true, exclusive:false}, function(dirEntry) {
            // Recursively add the new subfolder (if we still have another to create).
            folders = folders.slice(1);
            if (folders.length) {
              createFolder(dirEntry, folders);
            } else if (callback) {
              callback(dirEntry);
            }
          }, errorHandler);

        }

        var folders = util.path2array(path);
        createFolder(self.fs, folders); // fs.root is a DirectoryEntry

      }

      if (this.fs) {
        createPath();
      } else {
        this.requestFileSystem(createPath);
      }
    };

    /**
     * Determine whether a file exists in the sandboxed FS
     *
     * @param {String} file's path.
     * @param {Function} callback whose argument is the File object if found or
     * null otherwise.
     */
    fmjs.LocalFileManager.prototype.isFile = function(filePath, callback) {
      var self = this;

      function findFile() {

        function errorHandler(err) {
          window.console.log('File not found. Error code: ' + err.code);
          callback(null);
        }

        self.fs.root.getFile(filePath, {create: false}, function(fileEntry) {
          // Get a File object representing the file,
          fileEntry.file(function(fileObj) {
            callback(fileObj);
          }, errorHandler);
        }, errorHandler);
      }

      if (this.fs) {
        findFile();
      } else {
        this.requestFileSystem(findFile);
      }
    };

    /**
     * Read a file from the sandboxed FS
     *
     * @param {String} file's path.
     * @param {Function} callback whose argument is an ArrayBuffer object containing
     * the file data if the file is successfuly read or null otherwise.
     */
    fmjs.LocalFileManager.prototype.readFile = function(filePath, callback) {

      this.getFileBlob(filePath, function(fileObj) {
        var reader = new FileReader();

        reader.onload = function() {
          callback(this.result);
        };

        if (fileObj) {
          reader.readAsArrayBuffer(fileObj);
        } else {
          callback(null);
        }
      });
    };

    /**
     * Get a File object from the sandboxed FS
     *
     * @param {String} file's path.
     * @param {Function} callback whose argument is a File object if the file is successfuly
     * retrieved or null otherwise.
     */
    fmjs.LocalFileManager.prototype.getFileBlob = function(filePath, callback) {
      var self = this;

      function getFile() {

        function errorHandler(err) {
          window.console.log('Could not retrieve file object. Error code: ' + err.code);
          callback(null);
        }

        self.fs.root.getFile(filePath, {create: false}, function(fileEntry) {

          // Get a File object representing the file,
          fileEntry.file(function(fileObj) {
            callback(fileObj);
          }, errorHandler);
        }, errorHandler);
      }

      if (this.fs) {
        getFile();
      } else {
        this.requestFileSystem(getFile);
      }
    };

    /**
     * Write a file to the sandboxed FS
     *
     * @param {String} file's path.
     * @param {Array} ArrayBuffer object containing the file data.
     * @param {Function} optional callback whose argument is the File object or
     * null otherwise.
     */
    fmjs.LocalFileManager.prototype.writeFile = function(filePath, fileData, callback) {
      var self = this;

      function checkPathAndWriteFile() {

        function errorHandler(err) {
          window.console.log('Could not write file. Error code: ' + err.code);
          if (callback) {
            callback(null);
          }
        }

        function writeFile() {
          self.fs.root.getFile(filePath, {create: true}, function(fileEntry) {
            // Create a FileWriter object for our FileEntry (filePath).
            fileEntry.createWriter(function(fileWriter) {

              fileWriter.onwrite = function() {
                if (callback) {
                  // Get a File object representing the file,
                  fileEntry.file(function(fileObj) {
                    callback(fileObj);
                  }, errorHandler);
                }
              };

              fileWriter.onerror = function(err) {
                window.console.log('Could not write file. Error code: ' + err.toString());
                if (callback) {
                  callback(null);
                }
              };

              var bBuilder = new BlobBuilder();
              bBuilder.append(fileData);
              var dataBlob = bBuilder.getBlob();
              fileWriter.write(dataBlob);

            }, errorHandler);
          }, errorHandler);
        }

        var basedir = filePath.substring(0, filePath.lastIndexOf('/'));
        self.fs.getDirectory(basedir, {create: false}, function() {
          writeFile();
        }, function (err) {if (err.code === FileError.NOT_FOUND_ERR) {
          self.createPath(basedir, writeFile);} else {
            errorHandler(err);
          }} );
      }

      if (this.fs) {
        checkPathAndWriteFile();
      } else {
        this.requestFileSystem(checkPathAndWriteFile);
      }

    };


    /**
     * Concrete class implementing a file manager for Google Drive.
     * Uses Google Drive's API
     *
     * @constructor
     * @extends {fmjs.AbstractFileManager}
     * @param {String} Client ID from the Google's developer console.
     */
    fmjs.GDriveFileManager = function(clientId) {
      // Google's ID for the client app
      this.CLIENT_ID = clientId;
      // Permissions to access files uploaded through the API and read-only access to files
      this.SCOPES = ['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/drive.readonly'];
      // Has OAuth 2.0 client library been loaded?
      this.clientOAuthAPILoaded = false;
      // Has Google Drive API been loaded?
      this.driveAPILoaded = false;
      // Current user information (name, mail)
      this.userInfo = null;

    };

    /**
     * fmjs.GDriveFileManager class inherits from fmjs.AbstractFileManager class
     */
    fmjs.GDriveFileManager.prototype = Object.create(fmjs.AbstractFileManager.prototype);
    fmjs.GDriveFileManager.prototype.constructor = fmjs.GDriveFileManager;

    /**
     * Check if the current user has authorized the application and then load the GDrive Api.
     *
     * @param {Boolean} whether or not to open a popup window.
     * @param {Function} callback whose argument is a boolean true if success
     */
    fmjs.GDriveFileManager.prototype.requestFileSystem = function(immediate, callback) {
      var self = this;

      function callbackClosure() {
        callback(true);
      }

      function authorize() {
        self.authorize(immediate, function(authorized) {
          if (authorized) {
            self.loadApi(callbackClosure);
          } else {
            callback(false);
          }
        });
      }

      if (self.clientOAuthAPILoaded) {
        authorize();
      } else {
        gapi.load('auth:client', function() {
          self.clientOAuthAPILoaded = true;
          authorize();
        });
      }
    };

    /**
     * Check if the current user has authorized the application.
     *
     * @param {Boolean} whether or not to open a popup window.
     * @param {Function} callback whose argument is a boolean true if success
     */
     fmjs.GDriveFileManager.prototype.authorize = function(immediate, callback) {
       var self = this;

       if (self.clientOAuthAPILoaded) {
         // OAuth client library has already been loaded, requests using it can be sent
         gapi.auth.authorize({'client_id': self.CLIENT_ID, 'scope': self.SCOPES, 'immediate': immediate},
           function(authResult) {
             if (authResult && !authResult.error) {
               // Access token has been successfully retrieved, requests can be sent to the API.
               callback(true);
             } else {
               // No access token could be retrieved,
               callback(false);
             }
         });
       }
     };

    /**
     * Load GDrive API
     *
     * @param {Function} callback to be called when the api is loaded
     */
     fmjs.GDriveFileManager.prototype.loadApi = function(callback) {
       var self = this;

       if (this.clientOAuthAPILoaded) {
         // OAuth client library has already been loaded, requests using it can be sent
         if (this.driveAPILoaded) {
           callback();
         } else {
           gapi.client.load('drive', 'v2', function() {
             self.driveAPILoaded = true;
             callback();
           });
         }
       }
     };

     /**
      * Execute a GDrive API request.
      *
      * @param {Object} GDrive request object.
      * @param {Function} callback whose argument is the request response.
      */
     fmjs.GDriveFileManager.prototype.execGDriveRequest = function(request, callback) {
       var self = this;
       var ncalls = 0;

       function execRequest() {

         request.execute(function(resp) {
           if (resp.error) {
             ++ncalls;

             if (resp.error.code===401) {

               // auth token might have expired so check authorization
                self.authorize(true, function(authorized) {
                  if (authorized) {
                    request.execute(function(resp2) {
                      callback(resp2);
                    });
                  } else {
                    console.error('Authorization failed. No access token could be retrieved!');
                    callback(resp);
                  }
                });
             } else if (ncalls<=5) {

               // exponential delay, maximum number of request attempts is 5
               window.setTimeout(execRequest,
                 Math.floor(1000*Math.pow(2, ncalls-1) + Math.random() * 100));

             } else {
               console.error(resp.error.message);
               callback(resp);
             }
           } else {
             callback(resp);
           }
         });
       }

       execRequest();
     };

    /**
     * Create a new directory path in the GDrive cloud
     *
     * @param {String} new absolute path to be created.
     * @param {Function} optional callback whose argument is the folder creation
     * response object or null otherwise.
     */
    fmjs.GDriveFileManager.prototype.createPath = function(path, callback) {
      var self = this;

      function createFolder(rootResp, folders) {
        // list folder with name folders[0] if it already exists
        var findRequest = gapi.client.drive.children.list({
          'folderId': rootResp.id,
          'q': "mimeType='application/vnd.google-apps.folder' and title='" + folders[0] + "'"
        });

        self.execGDriveRequest(findRequest, function(findResp) {
          if (!findResp.error) {
            // if folder not found then create it
            if (findResp.items.length===0) {
              var request = gapi.client.drive.files.insert({
                'resource': {'title': folders[0], 'mimeType': 'application/vnd.google-apps.folder', 'parents': [{'id': rootResp.id}]}
              });

              self.execGDriveRequest(request, function(resp) {
                if (!resp.error) {
                  folders = folders.slice(1);
                  if (folders.length) {
                    //recursively create subsequent folders if needed
                    createFolder(resp, folders);
                  } else if (callback) {
                    callback(resp);
                  }
                } else {
                  console.log('Error: ', resp.error);
                  if (callback) {callback(null);}
                }
              });
            } else {
              folders = folders.slice(1);
              if (folders.length) {
                // recursively create subsequent folders if needed
                createFolder(findResp.items[0], folders);
              } else if (callback) {
                callback(findResp.items[0]);
              }
            }
          } else {
            console.log('Error: ', findResp.error);
            if (callback) {callback(null);}
          }
        });
      }

      if (this.driveAPILoaded) {
        var folders = util.path2array(path);
        if (folders.length) {
          createFolder({'id': 'root'}, folders);
        } else if (callback) {
          callback(null);
        }
      } else {
        console.error("GDrive Api not loaded");
      }
    };

    /**
     * Determine whether a file exists in the GDrive cloud
     *
     * @param {String} file's path.
     * @param {Function} callback whose argument is the file response object if
     * found or null otherwise.
     */
    fmjs.GDriveFileManager.prototype.isFile = function(filePath, callback) {
      var self = this;

      function findEntry(rootResp, entries) {
        var findRequest;

        // list entry with name entry[0] if it exists. The search request depends
        // on whether we are at the filename entry or at an ancestor folder
        if (entries.length===1) {
          findRequest = gapi.client.drive.children.list({
            'folderId': rootResp.id,
            'q': "mimeType!='application/vnd.google-apps.folder' and title='" + entries[0] + "'"
          });
        } else {
          findRequest = gapi.client.drive.children.list({
            'folderId': rootResp.id,
            'q': "mimeType='application/vnd.google-apps.folder' and title='" + entries[0] + "'"
          });
        }

        self.execGDriveRequest(findRequest, function(findResp) {

          if (!findResp.error) {
            if (findResp.items.length===0) {
              console.log('File ' + filePath + ' not found!');
              callback(null);
            } else {
              // Entry was found! Check if there are more entries
              entries = entries.slice(1);
              if (entries.length) {
                // Recursively move to subsequent entry
                findEntry(findResp.items[0], entries);
              } else {
                // No more entries, current entry is the file
                // Request file response object (resource)
                self.getFileMeta(findResp.items[0].id, function(fileResp) {
                  callback(fileResp);
                });
              }
            }
          } else {
            console.log('Error: ', findResp.error);
            callback(null);
          }
        });
      }

      if (this.driveAPILoaded) {
        var entries = util.path2array(filePath);

        if (entries.length) {
          findEntry({'id': 'root'}, entries);
        } else {
          callback(null);
        }
      } else {
        console.error("GDrive Api not loaded");
      }
    };

    /**
     * Given a file id get the file response object containing the file meta information
     * from the GDrive cloud if authorized. Can get file meta from another user's GDrive
     * if read permission has been granted to the current user.
     *
     * @param {String} file's id.
     * @param {Function} callback whose argument is the file response object if the request
     * is successful or null otherwise.
     */
     fmjs.GDriveFileManager.prototype.getFileMeta = function(fileId, callback) {

       if (this.driveAPILoaded) {
         // Request file response object (resource)
         var fileRequest = gapi.client.drive.files.get({
           'fileId': fileId
         });

         this.execGDriveRequest(fileRequest, function(fileResp) {
           if (!fileResp.error) {
             callback(fileResp);
           } else {
             console.error('Could not retrive file with id ' + fileId);
             callback(null);
           }
         });
       } else {
         console.error("GDrive Api not loaded");
       }
     };

    /**
     * Read a file from the GDrive cloud
     *
     * @param {String} file's path.
     * @param {Function} callback whose argument is the file data object if the file is
     * successfuly read or null otherwise.
     */
    fmjs.GDriveFileManager.prototype.readFile = function(filePath, callback) {
      var self = this;

      this.isFile(filePath, function(fileResp) {
        if (fileResp && !fileResp.error) {
          self.readFileByID(fileResp.id, callback);
        } else {
          callback(null);
        }
      });

    };

    /**
     * Given a file id read the file from the GDrive cloud if authorized. Can read
     * a file from another user's GDrive if read permission has been granted to the
     * current user.
     *
     * @param {String} file's id.
     * @param {Function} callback whose argument is the file data object if the file is
     * successfuly read or null otherwise.
     */
    fmjs.GDriveFileManager.prototype.readFileByID = function(fileId, callback) {
      var reader = new FileReader();

      reader.onload = function() {
        callback(reader.result);
      };

      this.getFileBlob(fileId, function(blob) {
        if (blob) {
          reader.readAsArrayBuffer(blob);
        } else {
          callback(null);
        }
      });
    };

    /**
     * Given a file id read the file from the GDrive cloud if authorized and return a Blob
     * object. Can read a file from another user's GDrive if read permission has been granted
     * to the current user.
     *
     * @param {String} file's id.
     * @param {Function} callback whose argument is the Blob object if the file is
     * successfuly read or null otherwise.
     */
     fmjs.GDriveFileManager.prototype.getFileBlob = function(fileId, callback) {
       var ncalls = 0;
       var self = this;

       function getBlob() {

         self.getFileMeta(fileId, function(fileResp) {

           var accessToken = gapi.auth.getToken().access_token;
           var xhr = new XMLHttpRequest();

           xhr.open('GET', fileResp.downloadUrl);
           xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);

           // Response handlers.
           xhr.responseType = "blob"; // force the HTTP response, response-type header to be blob
           xhr.onload = function() {
             callback(xhr.response);
           };

           xhr.onerror = function() {
             ++ncalls;
             if (ncalls<=5) {
                // exponential delay, maximum number of request attempts is 5
                window.setTimeout(getBlob,
                  Math.floor(1000*Math.pow(2, ncalls-1) + Math.random() * 100));
              } else {
                window.console.log('Could not read file: ' + fileResp.title + ' with id: ' + fileResp.id);
                callback(null);
              }
           };

           xhr.send();
         });
       }

       getBlob();
     };

    /**
     * Write a file to GDrive
     *
     * @param {String} file's path.
     * @param {Array} ArrayBuffer object containing the file data.
     * @param {Function} optional callback whose argument is the file response object.
     */
    fmjs.GDriveFileManager.prototype.writeFile = function(filePath, fileData, callback) {
      var self = this;

      // callback to insert new file.
      function writeFile(baseDirResp) {

        if (baseDirResp && !baseDirResp.error) {
          var boundary = '-------314159265358979323846';
          var delimiter = "\r\n--" + boundary + "\r\n";
          var close_delim = "\r\n--" + boundary + "--";

          var contentType = fileData.type || 'application/octet-stream';
          var name = fileData.name || filePath.substring(filePath.lastIndexOf('/') + 1);
          var metadata = {
            'title': name,
            'mimeType': contentType,
            'parents': [{'id': baseDirResp.id}]
          };

          var base64Data = btoa(util.ab2str(fileData));
          var multipartRequestBody =
              delimiter +
              'Content-Type: application/json\r\n\r\n' +
              JSON.stringify(metadata) +
              delimiter +
              'Content-Type: ' + contentType + '\r\n' +
              'Content-Transfer-Encoding: base64\r\n' +
              '\r\n' +
              base64Data +
              close_delim;

          var request = gapi.client.request({
              'path': '/upload/drive/v2/files',
              'method': 'POST',
              'params': {'uploadType': 'multipart' /*resumable for more than 5MB files*/},
                'headers': {
                  'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody});

          self.execGDriveRequest(request, function(resp) {
            if (callback) {callback(resp);}
          });
        }
      }

      var basedir = filePath.substring(0, filePath.lastIndexOf('/'));
      this.createPath(basedir, writeFile);
    };

    /**
     * Create a file in GDrive
     *
     * @param {String} file's path.
     * @param {String} MIME type string.
     * @param {Function} optional callback whose argument is the file response object.
     */
    fmjs.GDriveFileManager.prototype.createFile = function(filePath, mimeType, callback) {
      var idx = filePath.lastIndexOf('/');
      var baseDir = filePath.substring(0, idx);
      var name = filePath.substring(idx + 1);
      var self = this;

      this.createPath(baseDir, function(baseDirResp) {
        if (baseDirResp && !baseDirResp.error) {
          var request = gapi.client.drive.files.insert({
            'resource': {
              mimeType: mimeType,
              title: name,
              'parents': [{'id': baseDirResp.id}]
              }
          });

          self.execGDriveRequest(request, function(resp) {
            if (callback) {callback(resp);}
          });
        }
      });
    };

    /**
     * Share a file in current users's GDrive with the specified permissions.
     *
     * @param {String} file's path.
     * @param {Object} object with properties: value, type, role as indicated at:
     * https://developers.google.com/drive/v2/reference/permissions/insert
     * @param {Function} optional callback whose argument is the shared file
     * response object.
     */
    fmjs.GDriveFileManager.prototype.shareFile = function(filePath, permissions, callback) {
      var self = this;

      this.isFile(filePath, function(fileResp) {
        if (fileResp && !fileResp.error) {
          self.shareFileById(fileResp.id, permissions, callback);
        } else {
          console.error("File " + filePath + " not found");
        }
      });

    };

    /**
     * Share a file in current users's GDrive with the specified permissions.
     *
     * @param {String} file's id.
     * @param {Object} object with properties: value, type, role as indicated at:
     * https://developers.google.com/drive/v2/reference/permissions/insert
     * @param {Function} optional callback whose argument is the shared file
     * response object or null otherwise.
     */
    fmjs.GDriveFileManager.prototype.shareFileById = function(fileId, permissions, callback) {

      if (this.driveAPILoaded) {
        var request = gapi.client.drive.permissions.insert({
          'fileId': fileId,
          'resource': {'value': permissions.value, 'type': permissions.type, 'role': permissions.role}
          });

        this.execGDriveRequest(request, function(resp) {
          if (!resp.error) {
            if (callback) {callback(resp);}
          } else {
            console.error('Could not share file with id ' + fileId);
            if (callback) {callback(null);}
          }
        });
      } else {
        console.error("GDrive Api not loaded");
      }
    };

    /**
     * Get information about current GDrive user.
     *
     * @param {Function} callback whose argument is an object with the user
     * info (properties: id, name, mail) or null if there was an error.
     */
    fmjs.GDriveFileManager.prototype.getUserInfo = function(callback) {
      var self = this;

      if (this.userInfo) {
        callback(this.userInfo);
      } else {
        // retrieve the user info from GDrive
        if (this.driveAPILoaded) {
          var request = gapi.client.drive.about.get();

          this.execGDriveRequest(request, function(resp) {
            if (!resp.error) {
              var userDataObj = {id: resp.permissionId, name: resp.name, mail: resp.user.emailAddress};
              self.userInfo = userDataObj;
              callback(userDataObj);
            } else {
              console.error('Could not retrieve current user info');
              callback(null);
            }
          });
        } else {
          console.error("GDrive Api not loaded");
        }
      }
    };


    /**
     * Concrete class implementing a file manager for Dropbox.
     * Uses Dropbox API
     *
     * @constructor
     * @extends {fmjs.AbstractFileManager}
     */
    //fmjs.DropboxFileManager = function() {


    //};

    /**
     * fmjs.DropboxFileManager class inherits from fmjs.AbstractFileManager class
     */
    //fmjs.DropboxFileManager.prototype = Object.create(fmjs.AbstractFileManager.prototype);
    //fmjs.DropboxFileManager.prototype.constructor = fmjs.DropboxFileManager;

    /**
     * Load Dropbox API
     *
     * @param {Function} callback to be called when the API is ready.
     */
    //fmjs.DropboxFileManager.prototype.requestFileSystem = function(callback) {

    //};

    /**
     * Create a new directory path in the Dropbox cloud
     *
     * @param {String} new absolute path to be created.
     * @param {Function} optional callback whose argument is the folder creation
     * response object or null otherwise.
     */
    //fmjs.DropboxFileManager.prototype.createPath = function(path, callback) {

    //};

    /**
     * Determine whether a file exists in the Dropbox cloud
     *
     * @param {String} file's path.
     * @param {Function} callback whose argument is the file response object if
     * found or null otherwise.
     */
    //fmjs.DropboxFileManager.prototype.isFile = function(filePath, callback) {

    //};

    /**
     * Read a file from the Dropbox cloud
     *
     * @param {String} file's path.
     * @param {Function} callback whose argument is the file data if the file is
     * successfuly read or null otherwise.
     */
    //fmjs.DropboxFileManager.prototype.readFile = function(filePath, callback) {

    //};

    /**
     * Write a file to Dropbox
     *
     * @param {String} file's path.
     * @param {Array} ArrayBuffer object containing the file data.
     * @param {Function} optional callback whose argument is the response object.
     */
    //fmjs.DropboxFileManager.prototype.writeFile = function(filePath, fileData, callback) {

    //};


  return fmjs;
});