/**
 * This module implements the file manager's specification (tests).
 *
 */

define(['fmjsPackage'], function(fmjs) {

  describe('fmjs', function() {
    var driveFm;

    beforeEach(function() {

      driveFm = new fmjs.GDriveFileManager('358010366372-o8clkqjol0j533tp6jlnpjr2u2cdmks6.apps.googleusercontent.com');

      driveFm.requestFileSystem(true, function(granted) {
        return granted;
      });
    });

    it('driveFm.getUserInfo returns object with property mail', function () {

        expect(driveFm.getUserInfo(function(user) {
          return user.mail;
        })).toEqual('admin@babymri.org');
    });
  });

});
