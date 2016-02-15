require.config({
  baseUrl: '../',
  // use packages to be able to use relative path in the package
  packages: [
  // local packages
  {
    name: 'utiljsPackage', // used for mapping...
    location: 'src',   // relative to base url
    'main': 'js/utiljs'
  }
  ]
});
