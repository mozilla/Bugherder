[![Build Status](https://travis-ci.org/mozilla/bugherder.svg?branch=master)](https://travis-ci.org/mozilla/bugherder)
[![Dependency Status](https://david-dm.org/mozilla/bugherder.svg)](https://david-dm.org/mozilla/bugherder)
[![devDependency Status](https://david-dm.org/mozilla/bugherder/dev-status.svg)](https://david-dm.org/mozilla/bugherder#info=devDependencies)

Bugherder is a tool for marking bugs post-merge, created by [Graeme McCutcheon](http://www.graememcc.co.uk/).

NOTES ON TESTING
----------------
Adding "?debug=1" shows how all changesets were identified, and shows what changesets Bugherder decided were affected by a backout.


Running the Node.js static server locally
-----------------------------------------
1. Install [Node.js](https://nodejs.org/).
2. $ ``npm install --production``
(optionally omit ``--production`` to also install packages for the test suite).
3. $ ``npm start``
4. Navigate to [http://localhost:5000/](http://localhost:5000/).


Heroku notes
------------
* For setup instructions/CLI guide, see the Heroku
[getting started](https://devcenter.heroku.com/articles/getting-started-with-nodejs) tutorial.
* The presence of `package.json` will cause Heroku to pick the
[Node.js buildpack](https://github.com/heroku/heroku-buildpack-nodejs) automatically, however
it's preferable to pin to a specific version tag of the buildpack, using eg:
``heroku buildpacks:set git://github.com/heroku/heroku-buildpack-nodejs.git#v86``
* During deploy, Heroku runs ``npm install --production``.
* On start-up, the web dyno runs the command defined in the ``Procfile``.
* On production, HTTP is 301 redirected to HTTPS, and all files are served
with a Cache-Control max-age set.
* The "auto-deploy from master when CI has passed" option is enabled, to override
don't use ``git push`` - instead use the manual branch deploy controls
[here](https://dashboard.heroku.com/apps/bugherder/deploy/github).


STANDING ON THE SHOULDERS OF GIANTS
-----------------------------------
Bugherder uses the following third-party projects:

* bz.js by Heather Arthur - [https://github.com/harthur/bz.js](https://github.com/harthur/bz.js)
* jQuery - [http://jquery.com/](http://jquery.com)
* Toast CSS framework by Dan Eden - [http://www.daneden.me/toast](http://www.daneden.me/toast)
