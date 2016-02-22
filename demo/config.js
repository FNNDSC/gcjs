require.config({
  baseUrl: '../bower_components',

  // use packages to be able to use relative path in the package
  packages: [

    // bower packages
    {
      name: 'utiljsPackage', // used for mapping...
      location: 'utiljs/src',   // relative to base url
      main: 'js/utiljs'
    },

    // local package
    {
      name: 'gcjsPackage', // used for mapping...
      location: './', // relative to base url
      main: 'gcjs/src/js/gcjs'
    }
  ]
});
