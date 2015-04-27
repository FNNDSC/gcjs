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
