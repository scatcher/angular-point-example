angular-point-example
=======

This is an example application and development/build setup for an [angular-point](https://github.com/scatcher/angular-point.git)
project.  The [angular-point](https://github.com/scatcher/angular-point.git) framework and 
supporting modules are used by several large Single-Page Applications (SPA's) residing on a variety of enterprise 
SharePoint (2007/2010/2013) instances where policy prohibits deployment of server-side code.  

When ready for deployment, the minified files and resources (JS, HTML, CSS...) are placed in a folder(not document 
library) within a SharePoint site and accessed via the application root (index.html). The user typically doesn't 
realize that they're utilizing SharePoint because no SharePoint resources (CSS, JS, ASPX) are loaded with the page.  

With the optional [Firebase](https://www.firebase.com/) change notification integration, data is always kept in sync 
between all users within the application so there isn't a need to reload.  The view is updated dynamically as 
other users make changes to the underlying data stored in SharePoint lists/libraries through a simple subscription
system utilizing Firebase.

A lot of proprietary content/modules were removed from this application but it should still serve to demonstrate some
of the uses of [angular-point](https://github.com/scatcher/angular-point.git).  

The offline development environment included with [angular-point](https://github.com/scatcher/angular-point.git) 
attempts to utilize cached XML query responses from the lists you're planning to use but due to the nature of the 
data I wasn't able to publish the accompanying XML files here along with the project.  As a fallback, the offline 
environment attempts to generate mock XML responses (although not very well).  

This project was pretty tightly coupled to [Firebase](https://www.firebase.com/) for real-time change notifications 
so when you run it you'll see some errors if your own Firebase url isn't specified in common/config.ts file.

Install the required tools
---------
[Install NodeJS](http://nodejs.org/): 
Node provides the framework for all other project components.

[Install Git](http://git-scm.com/): 
Open source version control system.

Open terminal/cmd and install [Gulp](http://gulpjs.com/):

    npm install --global gulp
    
Next install [Bower](http://bower.io/), our package manager:

    npm install -global bower

Cloning the Repository
---------
Navigate to the local folder on your computer where the project code will reside and clone the repo using terminal/cmd:

    git clone https://github.com/scatcher/angular-point-example.git

Installing Dependencies
---------
Install the required node modules

    npm install

Install project dependencies (gets everything identified in bower.json)

    bower install
    
Configure Project Settings
---------

Go to app/common/config.ts and define your environment.  At a minimum, set the defaultUrl to the site where your 
lists/libraries reside.

Map List/Library
---------

The model for each list/library in SharePoint can be found under app/common/model.  The key components of every model
is the list item constructor and the model definition.  We'll look at musterModel.ts as an example.  

#### List Item Constructor
The "Muster" class defines an individual muster list item and each new list item we retrieve from SharePoint is 
instantiated using this class so all methods are available directly from the list item object.  The list item is 
extended using the base "ap.ListItem" class that includes the default methods available to all list items and more info 
can be found [here](http://scatcher.github.io/angular-point/#/api/angularPoint) under the "ListItem" nav on the left side.

#### Model Definition
The MusterModel class defines the [list](http://scatcher.github.io/angular-point/#/api/List) itself.  It is extended
using the core ap.Model class which provides all common model functionality.  More information can be found at the main
[angular-point docs](http://scatcher.github.io/angular-point/#/api/angularPoint) site on the left side nav under "Model".

The first important thing that needs to be defined here is the list.guid 
because this is the unique identifier used in all web service calls to interact with the SOAP web services for this 
list or library.

The next thing that needs to be defined is the list.customFields array which maps our SharePoint field names/types to
our JavaScript property names/values.  Based on the defined type of field, we format the value accordingly but by default
all field objectTypes are Text.  See [the field documentation](http://scatcher.github.io/angular-point/#/api/Field) for
additional info.

At this point it's time to define our named queries using the 
[model.registerQuery](http://scatcher.github.io/angular-point/#/api/Model.registerQuery) method on the instantiated
model.  Once registered, you'll be able to execute this query from anywhere in the application using 

    musterModel.executeQuery('MY-QUERY-NAME')
        .then((musterListItems: ap.IndexedCache<Muster>) => {
            //I now have my cached muster records
            
        });
        
Additional info on the model.executeQuery method can be found [here](http://scatcher.github.io/angular-point/#/api/Model.executeQuery).

At this point the data source is ready to be used within the application.


Post-Setup
---------
To see your code in the browser using gulp

    gulp serve
    
The offline environment will intercept all outgoing calls to SharePoint and depending if you have cached xml files
available will return cached server responses or dynamically generated mock server responses.  All application 
interactions while in this environment will persist until the browser is reloaded.  

All project script/style files in the main app folder will automatically get injected into the build blocks contained
in the app/index.html file so there is no need to manually create script/style references.  Any changes made to the 
code will cause any necessary compilers (TypeScript/LESS) to run and the browser will automatically refresh.
 
    
Prepare code for SharePoint
---------
Gulp will concat and minify our code.  The output of this process is put into the /dist folder.

    gulp deploy
    
    
We combine all of the script references into concatenated files and inject a reference to the new scipt files in the
dist/index.html file.  All html is added to the Angular template cache and added to the dist/app.js so no server side
requests for templates is required and the application will appear much more responsive.


Update our dependencies
---------
We can either update all dependencies

    bower update
    
or update a specific dependency

    bower update PackageName
    

Run unit tests
---------
Run a single unit test

    gulp test
       
or run continuous tests whenever a file is changed

    gulp autotest
    
or to debug a test

    gulp debugtest
    
      
Code Style
---------
John Papa's [Angular JS Guide](https://github.com/johnpapa/angularjs-styleguide) guide should be referenced for all
style and structure guidance.


Working Offline
---------
 All cached XML requests should be stored in "./xml-cache/", named to match the list.  So as an example offline data
 for a list named Projects would be "./xml-cache/Projects.xml".
