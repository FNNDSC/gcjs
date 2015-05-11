/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',

    // Custome Paths
    srcFiles: ['src/js/gcjs.js'], // source files
    testFiles: ['<%= componentsDir %>/fmjs/spec/*.spec.js', 'spec/*.spec.js'], // test files (jasmin' specs)
    libDir: 'src/js/lib', // libraries that cannot be installed through bower
    componentsDir: 'src/js/components', // bower components

    // Task configuration.
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        globals: {
          console: true, document: true, gapi: true, FileReader: true, BlobBuilder: true,
          XMLHttpRequest: true, ArrayBuffer: true, Uint8Array: true, FileError: true,
          atob: true, btoa: true, window: true, define: true, require: true, describe: true,
          it: true, expect: true, beforeEach: true, alert: true
        }
      },
      source: {
        src: '<%= srcFiles %>'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      test: {
        src: '<%= testFiles %>'
      }
    },

    watch: {
      files: ['src/**/*.js','src/**/*.css', 'src/**/*.html', '<%= jshint.gruntfile.src %>'],
      tasks: ['jshint:source', 'jshint:gruntfile', 'jasmine:test']
    },

    browserSync: {
      dev: {
          bsFiles: {
              src : [
                  'src/**/*.js',
                  'src/**/*.css',
                  'src/**/*.html'
              ]
          },
          options: {
              watchTask: true,
              // test to move bower_components out...
              // bower_components not used yet...
              server: ['src', 'bower_components']
          }
      }
    },

    jasmine: {
      test: {
        //src: '<%= jshint.source.src %>', this line must be commented when using the define function within the specs files
        options: {
          specs: '<%= jshint.test.src %>',
          template: require('grunt-template-jasmine-requirejs'),
          templateOptions: {
            version: '<%= componentsDir %>/requirejs/require.js',
            requireConfigFile: 'src/main.js', // requireJS's config file
            requireConfig: {
              baseUrl: '<%= componentsDir %>' // change base url to execute tests from local FS
            }
          }
        }
      }
    },

    requirejs: {
      compile: {
        options: {
          baseUrl: '<%= componentsDir %>',
          name: 'gcjs',
          mainConfigFile: 'src/main.js',
          out: 'dist/js/<%= pkg.name %>.min.js'
        }
      }
    }

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browser-sync');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  // Serve task.
  grunt.registerTask('serve', function(/*target*/) {
    // grunt server:dist not implemented yet...

    // if (target === 'dist') {
    //   return grunt.task.run(['build', 'browserSync:dist',
    //   'watch']);
    // }

    grunt.task.run([
      'browserSync:dev',
      'watch'
    ]);
  });

  // Test task.
  grunt.registerTask('test', ['jshint', 'jasmine']);
  // Build task.
  //grunt.registerTask('build', ['jshint', 'jasmine', 'requirejs']);
  grunt.registerTask('build', ['jshint', 'requirejs']);
  // Default task.
  grunt.registerTask('default', ['build']);

};
