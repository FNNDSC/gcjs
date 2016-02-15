require.config({
  baseUrl: '../',
  // use packages to be able to use relative path in the package
  packages: [
  // bower packages
  {
    name: 'utiljsPackage', // used for mapping...
    location: '../utiljs/src',   // relative to base url
    main: 'js/utiljs'
  },
  // local packages
  {
    name: 'gcjsPackage', // used for mapping...
    location: 'src',   // relative to base url
    main: 'js/gcjs'
  }
  ]
});