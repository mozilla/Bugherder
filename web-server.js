var express = require('express');
var enforce = require('express-sslify');

var app = express();
var options = {};

// On Heroku web dynos must bind to the port defined by the env variable 'PORT'.
app.set('port', (process.env.PORT || 5000));

if (process.env.NODE_ENV === 'production') {
  // Redirect HTTP to HTTPS (uses Heroku's x-forwarded-proto header).
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
  // Give all files a Cache-Control max-age of 15 minutes.
  // Intentionally not enabled during development.
  options = { maxAge: '15m' };
}

// Serve the bugherder subdirectory using the express.static middleware.
app.use(express.static(__dirname + '/bugherder', options));

app.listen(app.get('port'), function() {
  console.log("Server is running at http://localhost:" + app.get('port'));
});
