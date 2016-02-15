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
    srcFiles: ['src/js/fmjs.js'], // source files
    testFiles: ['spec/*.spec.js'], // test files (jasmin' specs)
    componentsDir: 'bower_components', // bower components

    // Task configuration.
    jscs: { // check javascript style
      options: {
        config: '.jscsrc',  // configuration file
        fix: true,
        force: true
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

    jshint: { // check javascript syntax and errors
      options: {
        jshintrc: true // configuration file
      },
      source: {
        src: '<%= jscs.source.src %>'
      },
      gruntfile: {
        src: '<%= jscs.gruntfile.src %>'
      },
      test: {
        src: '<%= jscs.test.src %>'
      }
    },

 connect: {
      test: {
        options: {
          port: 8000,
          base: [
            '.',
            'bower_components'
          ]
        }
      }
    },

    jasmine: { // run tests
      test: {
        // comment when using the define function within the specs files
        //src: '<%= jshint.source.src %>',
        options: {
          debug: true,
          host: 'http://localhost:8000/',
          specs: '<%= jshint.test.src %>',
          template: require('grunt-template-jasmine-requirejs'),
          templateOptions: {
            version: '<%= componentsDir %>/requirejs/require.js',
            requireConfigFile: 'demo/config.js', // requireJS's config file
            requireConfig: {
              baseUrl: '.' // change base url to execute tests from local FS
            }
          }
        }
      }
    },

    requirejs: { // concat and minimize AMD modules
      compile: {
        options: {
          baseUrl: '.',
          include: 'dist/<%= pkg.name %>/src/js/fmjs.js',
          mainConfigFile: 'dist/<%= pkg.name %>/src/js/fmjs.js',
          out: 'dist/<%= pkg.name %>.min.js'
        }
      }
    },

    copy: {
      components: {
        files: [
          {
            expand: true,
            cwd: '<%= componentsDir %>',
            src: ['**/*'],
            dest: 'dist/'
          },
          {
            expand: true,
            src: 'src/**/*',
            dest: 'dist/<%= pkg.name %>/'}]
      }
    },

    watch: {
      source: {
        files: '<%= jshint.source.src %>',
        tasks: ['jshint:source']
      },
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'jasmine']
      }
    },

    browserSync: {
      dev: {
        bsFiles: {
          src: [
              'demo/**/*.js',
              'demo/**/*.css',
              'demo/**/*.html',
              'src/**/*.js',
              'src/**/*.css',
              'src/**/*.html'
          ]
        },
        options: {
          watchTask: true,
          // serve base dir
          // AND
          // bower_components
          // AT SAME LEVEL
          server: ['.', 'bower_components'],
          startPath: '/demo'
        }
      }
    }

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
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
  grunt.registerTask('test',
    ['jscs', 'jshint', 'connect', 'jasmine']);

  // Build task.
  grunt.registerTask('build',
    ['jscs', 'jshint', 'connect', 'jasmine', 'copy', 'requirejs']);

  // Default task.
  grunt.registerTask('default',
    ['build']);

};
