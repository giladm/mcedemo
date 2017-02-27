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
    var store ='b';
    if (lat =="32.1291") {
      var store ='a';
    }
    console.log('lat',lat,'store',store);

    var body =getJson (muid,channelid,store);
    //res.render('sptest',{title: 'Page title', mobileid: muid,channel:channelid});
    var options = {
      uri: 'https://api0.silverpop.com/rest/channels/push/sends',
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
//        "Content-Length": Buffer.byteLength(body)
      },
      auth: {
      'bearer': 'aImaqGxWI5KJ-E0G0mZFLnw8Zw-WN_yU26qIXfyHOYd8S1'
      },
      json: body
    };

    request(options, function (error, response, body) {
      if (!error && response.statusCode == 202) {
  //      console.log('OK','response',response,'body',body) ; 
        return res.status(202).send(response.headers);
      } else {
        console.log('Error in push api',error) ;
        return res.status(403).send(error)
      }
    });
/*
    var x=getJson('0TXJ6HQaKiaY2waq','bCoJeyPe','a');
    return res.status(200).send(x);
*/
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


function getJson (muid,channelid,store) {
  var mid ='"'+muid+'"';
  var cid ='"'+channelid+'"';
  var demoJson ='{"channelQualifiers": [ "apv0ZvcHCU" ], "content": { "simple": { "apns": '+
    '{ "aps": { "alert": "Special Sale for all stores", "sound":"default", "badge": 3 }, "notification-action": { "type": "url", "name": "open url",'+
    ' "value": "http://192.168.1.3:3001/sptest-dynamic/'+ store+'" } } } }, "contacts": [ { "channel": { "appKey": "apv0ZvcHCU",'+
    ' "userId":'+mid+', "channelId":'+cid+'} } ] }';
//  console.log('return',JSON.stringify(demoJson) );
  return(JSON.parse(demoJson));
}

module.exports = publicRouter;