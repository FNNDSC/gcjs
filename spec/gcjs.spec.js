/**
 * This module implements the drive realtime collaboration specification (tests).
 *
 */

define(['gcjsPackage'], function(gcjs) {

  describe('gcjs', function() {
    var collab;

    beforeEach(function() {
      collab = new gcjs.GDriveCollab('358010366372-o8clkqjol0j533tp6jlnpjr2u2cdmks6.apps.googleusercontent.com');
    });

    it('driveFm.getUserInfo returns object with property mail', function() {
      expect(collab.fileManager.getUserInfo(function(user) {
          return user.mail;
        })).toEqual('admin@babymri.org');
    });
  });

});
