/**
 * This module implements frequently used JavaScript utility functions.
 */

// define a new module
define([], function() {

  /**
   * Provide a namespace for the utility module
   *
   * @namespace
   */
  var utiljs = utiljs || {};

  /**
   * Convert ArrayBuffer to String
   *
   * @function
   * @param {Array} input ArrayBuffer.
   * @return {string} the resulting string.
   */
  utiljs.ab2str = function(buf) {
       var bytes = new Uint8Array(buf);
       var str = String.fromCharCode(bytes[0]);

       for (var i = 1; i < bytes.byteLength; i++) {
         str += String.fromCharCode(bytes[i]);
       }
       return str;
     };

  /**
   * Convert String to ArrayBuffer
   *
   * @function
   * @param {String} input string.
   * @return {Array} the resulting array.
   */
  utiljs.str2ab = function(str) {
      // 1 byte for each char
      var buf = new ArrayBuffer(str.length);
      var bufView = new Uint8Array(buf);

      for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    };

  /**
   * Create a Blob object containing a JPG image from a data URI.
   *
   * @function
   * @param {String} a data URI such as the one returned by the toDataURL() of
   * a canvas element
   * @return {Object} Blob object containing the JPG image
   */
  utiljs.dataURItoJPGBlob = function(dataURI) {
       var binary = atob(dataURI.split(',')[1]);
       var array = [];

       for (var i = 0; i < binary.length; i++) {
         array.push(binary.charCodeAt(i));
       }
       return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
     };

  /**
   * Make an Ajax request to get a Blob from a url.
   *
   * @function
   * @param {String} a url
   * @param {Function} callback whose argument is the Blob object
   */
  utiljs.urlToBlob = function(url, callback) {
       var xhr = new XMLHttpRequest();

       xhr.open('GET', url);
       xhr.responseType = 'blob';//force the HTTP response, response-type header to be blob
       xhr.onload = function() {
         callback(xhr.response);//xhr.response is now a blob object
       };
       xhr.send();
     };

  /**
   * Set a files/folders dropzone.
   *
   * @function
   * @param {String|Object} dropzone's container's DOM id or DOM object.
   * @param {Function} callback to be called everytime files or folders are dropped. An
   * array of objects is passed as an argument to the callback. Each object has properties:
   * -url: url of the file (full path)
   * -file: HTML5 File object
   */
  utiljs.setDropzone = function(container, callback) {
    var dropzone;

    if (typeof container === 'string') {

      // a DOM id was passed
      dropzone = document.getElementById(container);

    } else {

      // a DOM object was passed
      dropzone = container;
    }

    //
    // event handlers for the dropzone
    //
    dropzone.ondragenter = function(e) {

      e.preventDefault();
    };

    dropzone.ondragover = function(e) {

      e.preventDefault();
    };

    dropzone.ondrop = function(e) {

      e.preventDefault();

      var files = [];
      var fObjArr = [];

      if (!e.dataTransfer.items) {

        // browser is not chrome
        if (e.dataTransfer.files) {

          files = e.dataTransfer.files;

          for (var i = 0; i < files.length; i++) {

            if ((!files[i].size) && (!files[i].type)) {

              alert('It seems that a folder has been dropped: "' + files[i].name +
              '". Only the Chrome bowser supports dropping of folders. Files inside will be ignored!');

            } else {

              if (!('fullPath' in files[i])) {

                files[i].fullPath = files[i].name;
              }

              fObjArr.push({
                    'url': files[i].fullPath,
                    'file': files[i]
                  });
            }
          }

          callback(fObjArr);
        }

        return;
      }

      // chrome browser

      // array to control when the entire directory tree has been read. This
      // happens when all it's entries are different from zero
      var hasBeenRead = [];

      // define function to read an entire directory tree
      var readFiles = function(entry) {

        var pos = hasBeenRead.length;
        var dirEntries = [];

        hasBeenRead[pos] = 0;

        function readingDone() {

          hasBeenRead[pos] = 1;

          //check whether all files in the directory tree have already been added
          for (var i = 0; i < hasBeenRead.length; i++) {

            if (hasBeenRead[i] === 0) {
              break;
            }
          }

          if (i >= hasBeenRead.length) {

            // all files have been read
            for (var j = 0; j < files.length; j++) {

              fObjArr.push({
                    'url': files[j].fullPath,
                    'file': files[j]
                  });
            }

            callback(fObjArr);
          }
        }

        function read(dirReader) {

          dirReader.readEntries(function(entries) {

            if (entries.length) {

              dirEntries = dirEntries.concat(entries);
              read(dirReader); //keep calling read recursively untill receiving an empty array

            } else {

              var idx = dirEntries.length; //manage empty dir

              while (idx--) { //recursively read last entry until all have been read
                readFiles(dirEntries[idx]);
              }

              readingDone();
            }
          });
        }

        if (entry.isFile) {

          entry.file(function(file) {

            file.fullPath = entry.fullPath;
            files.push(file);
            readingDone();
          });

        } else if (entry.isDirectory) {

          var reader = entry.createReader();

          //read all entries within this directory
          read(reader);
        }
      };

      for (var k = 0; k < e.dataTransfer.items.length; k++) {

        readFiles(e.dataTransfer.items[k].webkitGetAsEntry());
      }
    };
  };

  /**
   * Repaint the document
   * @function
   */
  utiljs.documentRepaint = function() {
      var ev = document.createEvent('Event');
      ev.initEvent('resize', true, true);
      window.dispatchEvent(ev);
    };

  /**
   * Return true if the string str ends with any of the
   * specified suffixes in arrayOfStr otherwise return false.
   *
   * @function
   * @param {String} input string
   * @param {Array} array of string suffixes
   * @return {boolean}
   */
  utiljs.strEndsWith = function(str, arrayOfStr) {
      var index;

      for (var i = 0; i < arrayOfStr.length; i++) {
        index = str.lastIndexOf(arrayOfStr[i]);
        if ((index !== -1) && ((str.length - index) === arrayOfStr[i].length)) {
          return true;
        }
      }
      return false;
    };

  /**
   * Sort an array of objects with a string property prop.
   * The ordering is based on that property.
   *
   * @function
   * @param {Array} array of string suffixes
   * @param {String} the objects' ordering property
   * @return {Array} Sorted array
   */
  utiljs.sortObjArr = function(objArr, prop) {

    return objArr.sort(function(o1, o2) {
         var values = [o1[prop], o2[prop]].sort();

         if (values[0] === values[1]) {
           return 0;
         } else if (values[0] === o1[prop]) {
           return -1;
         } else {
           return 1;
         }
       });
  };

  /**
   * Split a file or folder path into an array
   *
   * @function
   * @param {String} input path.
   * @return {Array} the resulting array.
   */
  utiljs.path2array = function(path) {
      var entries = path.split('/');
      // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
      if (entries[0] === '.' || entries[0] === '') {
        entries = entries.slice(1);
      }
      return entries;
    };

  return utiljs;
});
