# fmjs

This is a reusable JavaScript module that provides a uniform interface to common file operations
on abstract filesystems such as the HTML5 sandboxed filesystem (currently available only in Chrome)
and the Google Drive cloud storage service (GDrive). In particular, the exposed <tt>fmjs.GDriveFileManager</tt> 
class implements file uploading/downloading, file sharing and other operations on GDrive by leveraging
the GDrive REST API.

Take a look at [gcjs](https://github.com/FNNDSC/gcjs) as an example project that uses a
<tt>fmjs.GDriveFileManager</tt> object.

## Build
This project uses grunt.

### Pre-requisites:
* NodeJs - http://nodejs.org/

* Ensure that your npm is up-to-date:

````
sudo npm update -g npm
````

* Install grunt's command line interface (CLI) globally:

````
sudo npm install -g grunt-cli
````

* Install grunt and gruntplugins listed at "devDependencies" in package.json:

````
npm install
````

* Install bower:

````
sudo npm install -g bower
````

* Install dependencies listed in bower.json:

````
bower install
````

* Run grunt:

````
grunt
````

The project is built within the directory <tt>dist</tt>.
