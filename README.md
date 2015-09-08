# gcjs

This is a reusable JavaScript module that exposes a <tt>gcjs.GDriveCollab</tt> class that uses
the [fmjs.GDriveFileManager’s](https://github.com/FNNDSC/fmjs) functionality and the GDrive
Realtime REST API to implement real-time collaboration.

The real-time collaboration is actually implemented by making the application data to be kept in sync
among collaborators part of the GDrive Realtime Collaborative Data Model (RT-CDM). The <tt>gcjs.GDriveCollab</tt>
class provides methods to get and set the RT-CDM and three event listeners that can be dynamically overwritten
on its object instances:
* onConnect: called on an instance when it has successfully connected and collaboration is ready
* onDataFilesShared: called on all connected instances every time the collaboration owner has shared all
the data files in its GDrive with a new collaborator
* onCollabObjChanged: called on all connected instances every time the RT-CDM is updated by any remote
collaborator

Take a look at [viewerjs](https://github.com/FNNDSC/viewerjs) as an example project that uses a
<tt>gcjs.GDriveCollab</tt> object.

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
