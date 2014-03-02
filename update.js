#!/usr/bin/env node

var fs       = require('fs');
var request  = require('request');
var Q        = require('q');

// read configuration from file system
var config;
if(fs.existsSync('./config.json')) {
  config = require('./config');
}

var DNSIMPLE_USER  = (config) ? config.DNSIMPLE_USER  : process.env.DNSIMPLE_USER;
var DNSIMPLE_TOKEN = (config) ? config.DNSIMPLE_TOKEN : process.env.DNSIMPLE_TOKEN;
var UPDATE_DOMAIN  = (config) ? config.UPDATE_DOMAIN  : process.env.UPDATE_DOMAIN;

function getHeaders() {
  return {
    'X-DNSimple-Token': DNSIMPLE_USER + ':' + DNSIMPLE_TOKEN,
    'Accept': 'application/json'
  }
};

function getStatusCode(res) {
  if(res.statusCode) {
    return res.statusCode;
  } else if(res[0]) {
    return res[0].statusCode;
  }
}

function run() {
  var ip, recordId, update;

  // get the current ip address
  Q.nfcall(request.get, 'http://icanhazip.com')
    
    // request the records for the domain
    .then(function(res) {
      ip = res[1].trim();
      console.log('ip detected as ' + ip);
      var opts = {
        url: 'https://api.dnsimple.com/v1/domains/' + UPDATE_DOMAIN + '/records',
        headers: getHeaders()
      }
      console.log('getting domain records');
      console.log('request: ' + opts.url);
      return Q.nfcall(request, opts)
    })
    
    // parse the records and check for a stale ip address in the A record
    .then(function(res){
      if(getStatusCode(res) >= 300) {
        throw new Error(JSON.parse(res[0].body));
      }
      var records = JSON.parse(res[1]);
      for(var i=0; i<records.length; i++) {
        var rec = records[i].record;
        if(rec.record_type && rec.record_type === 'A') {
          recordId = rec.id;
          console.log('found \'A\' record: ' + rec.content);
          if(rec.content !== ip) {
            update = true;
            console.log('ip has changed');
            console.log('old ip: ' + rec.content);
          } else {
            update = false;
            console.log('ip matches - no changes needed');
          }
          break;
        }
      }
    })

    // if the A record needs updating, update it
    .then(function(){
      if(update) {
        var opts = {
          url: 'https://api.dnsimple.com/v1/domains/' + UPDATE_DOMAIN + '/records/' + recordId,
          json: {
            record: {
              content: ip,
              ttl: 3600
            }
          },
          headers: getHeaders(),
          method: 'PUT'
        }
        console.log('attempting to update ip');
        console.log('request: ' + opts.url);
        return Q.nfcall(request, opts);
      }
    })

    // check the response
    .then(function(res) {
      if(res && getStatusCode() >= 300) {
        throw new Error(JSON.parse(res[0].body));
      }
    })

    // all done
    .then(function(){
      console.log('[OK] finished successfully');
    })
    
    // something went wrong
    .fail(function(err) {
      console.error('[ERR] failed');
      console.error(JSON.stringify(err));
    })
}

run();