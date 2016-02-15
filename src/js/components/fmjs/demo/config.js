require.config({
  baseUrl: '../',
  packages: [
  {
    name: 'fmjsPackage', // used for mapping...
    location: 'src',     // relative to base url
    main: 'js/fmjs'     // relative to package folder
  }
  ]
});
