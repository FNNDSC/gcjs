/**
 * This module implements frequently used JavaScript utility functions.
 *
 */

define(['utiljsPackage'], function(utiljs) {
  describe('utiljs', function() {
    it('utiljs.strEndsWith(str, arrayOfStr) verifies if str ends with any of the strings in arrayOfStr',
      function() {
        expect(utiljs.strEndsWith('testfile.txt', ['.txt'])).toEqual(true);
      });
  });
});
