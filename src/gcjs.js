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
    // Google's ID for the client app
    this.CLIENT_ID = clientId;
    // Permissions to access files uploaded through the API
    this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
    // Has OAuth 2.0 client library been loaded?
    this.clientOAuthAPILoaded = false;
    // Has the client app been authorized?
    this.autorized = false;
    // Has Google Drive API been loaded?
    this.driveAPILoaded = false;
    // Current user information (name, email)
    this.userInfo = null;

  };

   gcjs.GDriveCollab.prototype.init = function() {


  };
