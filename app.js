'use strict';
var express    = require('express'),
    stylus = require('stylus'), 
    nib = require('nib') ,
    morgan= require('morgan');

var apphost = 'http://mcedemo.mybluemix.net';//'0.0.0.0'

// get the app environment from Cloud Foundry
// cfenv provides access to Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var vcapServices={};
// if running in Bluemix, use the environment variables
if (process.env.VCAP_SERVICES) {
    vcapServices = JSON.parse(process.env.VCAP_SERVICES);
    console.log("Running on Bluemix. mongourl = " +JSON.stringify(vcapServices));
    vcapServices.apphostUrl= 'http://mcedemo.mybluemix.net';
} else { // otherwise use local file
    try {
      var env = require('./.env.js');
      console.log('loading .env.js');
      for (var key in env) {
        if (!(key in process.env)) {
          process.env[key] = env[key];
        }
      }
        appEnv.port=process.env['VCAP_APP_PORT'];
        appEnv.url =appEnv.url.replace(/6003/,appEnv.port);

        vcapServices.client_id  =process.env['CLIENT_ID'];
        vcapServices.client_secret =process.env['CLIENT_SECRET'];
        vcapServices.refresh_token =process.env['REFRESH_TOKEN'];
        vcapServices.mongourl   =process.env['mongourl'];        
        vcapServices.apphostUrl ='0.0.0.0';
        
    } catch(ex) {
        console.error('.env.js not found',ex);
    }
}
console.log('Using url:',appEnv.url);
//console.log('vcap',vcapServices);
//exit();

// public website from clock.uk
var app = express() ;
function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(morgan('dev'))
app.use(stylus.middleware(
  { src: __dirname + '/public'
  , compile: compile
  }
))
app.use(express.static(__dirname + '/public'))
// end clock
// 
var publicRouter = express.Router();
require('./routes/publicRouter')(publicRouter,vcapServices);
app.use('/',publicRouter);
//

app.route('/')
    .get(function (req, res, next) {
        console.log('GET request for /');
        res.render('index', 
            { title : 'Home' }
        );
    });

app.use('/',publicRouter);

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});    
