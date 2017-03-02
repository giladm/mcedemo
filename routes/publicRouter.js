var express = require('express');
var https = require('https');
var http = require('http');
var url = require('url');
var bodyParser = require('body-parser');
var request = require('request') ;

var publicRouter = express.Router();
publicRouter.use(bodyParser.json());

publicRouter.route('/')
.get(function (req, res, next) {
	  console.log('GET request for /');
    res.render('index', 
        { title : 'Home' }
    );
});

// Testing for Silverpop Engage ./testsp/mid1234
publicRouter.route('/sptest/:muid')
.get(function (req, res, next) {
    console.log('GET for muid',req.params.muid);
    if (!req.params.muid) {
      console.log( 'Incomplete testsp params',req.params);
      return res.status(403).send('Missing muid')
    } 
    res.render('sptest',{title: 'Special 10% Sale', mobileid: req.params.muid});
});

// Generating Push event for dla exit entry
publicRouter.route('/sptest')
.post(function (req, res, next) {
    console.log('POST sptest',req.body);
    if (!req.body.muid || !req.body.channelid) {
      console.log( 'Incomplete testsp payload',req.body);
      return res.status(403).send('Missing muid or channeld')
    } 
    var lat =req.body.lat.substring(0,7) ;
    var lon  = req.body.lon ;
    var muid =req.body.muid ;
    var channelid =req.body.channelid ;
    var store ='B';
    if (lat =="32.1291") {
      var store ='A';
    }
    console.log('lat',lat,'store',store);

    var body =getJson (muid,channelid,store);
    //res.render('sptest',{title: 'Page title', mobileid: muid,channel:channelid});
    function getOauthToken() {
        getNewToken(function (err, token) {
            if (err) {
                console.log('Err:',err,'Token:',token);
                return res.status(401).send(err);
            } else { // sucess
                console.log('Token',token);
                var options = {
                  uri: 'https://api0.silverpop.com/rest/channels/push/sends',
                  method: 'POST',
                  headers: {
                    "Content-Type": "application/json"
                  },
                  auth: {
                  'bearer': token
                  },
                  json: body
                };

                request(options, function (error, response, body) {
                  if (!error && response.statusCode == 202) {
                    return res.status(202).send(response.headers);
                  } else {
                    console.log('Error in push api',error) ;
                    return res.status(response.statusCode).send(response.body)
                  }
                });
            }
        });
    }
    getOauthToken();
    

});

// Static page. Engage use iframe directing to this page.
publicRouter.route('/sptest-iframe')
  .get(function (req, res, next) {
    res.render('sptest-iframe',{});
});

// called by push url  
publicRouter.route('/sptest-dynamic/:store')
  .get(function (req, res, next) {
    console.log('GET for sptest-dynamin for store',req.params.store);
    if (!req.params.store) {
      console.log( 'Incomplete sptest-dynamic params',req.params);
      return res.status(403).send('Missing store')
    } 
    res.render('sptest-dynamic',{store: req.params.store});
});


// refresh token
publicRouter.route('/getoken')
.get(function (req, res, next) {
    console.log('GET token request',req.body);
    function getOauthToken() {
        getNewToken(function (err, token) {
            if (err) {
                console.log('Err:',err,'Token:',token);
                return res.status(401).send(err);
            } else { // sucess
                console.log('Token',token);
                return res.status(200).send(token);
            }
        });
    }
    getOauthToken();
});

function getNewToken(callback) {
    var urlParams ='https://api0.silverpop.com/oauth/token?'+getRefreshTokenParams ();
    //console.log('urlparams',urlParams);
    var options = {
      uri: urlParams,
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      }
    };

    request(options, function (error, response, body) {
      if (!error ) {
        //console.log('OK body:',body) ; 
        if (body ) {
            var bodyParse = JSON.parse(body)
            if (bodyParse.error) {
                console.log(bodyParse);
                callback (bodyParse.error,null);
            } else { // got new token
                callback (null,bodyParse.access_token); // success
            }
        } else {
            console.log('error body is null',response);
            callback( 'Null body returned',null);
        }
      } else {
        console.log('Error in push api',error) ;
        callback (error, null) ;
      }
    });
};

function getJson (muid,channelid,store) {
  var mid ='"'+muid+'"';
  var cid ='"'+channelid+'"';
  var demoJson ='{"channelQualifiers": [ "apv0ZvcHCU" ], "content": { "simple": { "apns": '+
    '{ "aps": { "alert": "Special Sale for Store '+store+'", "sound":"default", "badge": 3 }, "notification-action": { "type": "url", "name": "open url",'+
    ' "value": "https://mcedemo.mybluemix.net/sptest-dynamic/'+ store+'" } } } }, "contacts": [ { "channel": { "appKey": "apv0ZvcHCU",'+
    ' "userId":'+mid+', "channelId":'+cid+'} } ] }';
//  console.log('return',JSON.stringify(demoJson) );
  return(JSON.parse(demoJson));
}

// get json for token
function getRefreshTokenParams () {
  var client_id ='&client_id='+'e85b1c24-724f-47b7-9f15-a87395930c1c';
  var client_secret ='&client_secret='+'7b32500e-84ad-463a-8fde-b3cd43ec9a49';
  var refresh_token ='&refresh_token='+'rDW9L5axT0b8AN_3KJ9OsUUdyFUZZ1lEZoxi7p73SxtcS1';
  var params ='grant_type=refresh_token'+client_id+client_secret+refresh_token ;
  return(params);
}

module.exports = publicRouter;