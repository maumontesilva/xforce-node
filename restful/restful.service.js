/**
 * Created by maurosil on 24/03/2016.
 */

var express = require('express');
var request = require('request');
var Log = require('log');
var logger = new Log('info');

var url;
var username;
var password;

var RestfulService = function(protocol, server, port, user, pass) {
  if(!server) {
      var errorMsg = 'server name is not defined.';
      logger.error(errorMsg);
      throw errorMsg;
  }

  url = (protocol || 'https') + '://' + server + ':' + (port || '443') + '/';
  if(!user || !pass) {
      var errorMsg = 'User/Password not defined.';
      logger.error(errorMsg);
      throw errorMsg;
  }

  username = user;
  password = pass;
};

RestfulService.prototype.sendRequest = function(method, endpoint, body, callback) {
    var queryConfiguration = {
        method: method || 'GET',
        rejectUnauthorized: false //FOR NOW DO NOT CONSIDER CERT
    };

    queryConfiguration.url = url;

    if(endpoint) {
        queryConfiguration.url = queryConfiguration.url + endpoint;
    }

    if(body) {
        queryConfiguration.headers = {'content-type' : 'application/json'};
        queryConfiguration.body = JSON.stringify(body);
    }

    if(username && password) {
        var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
        if(queryConfiguration.headers) {
            queryConfiguration.headers.Authorization = auth;
        } else {
            queryConfiguration.headers = {Authorization : auth};
        }
    }
    logger.debug('queryConfiguration ', queryConfiguration);
    xforceRequest(queryConfiguration, callback);
};

module.exports = RestfulService;

function xforceRequest(queryConfiguration, cb) {
    request(queryConfiguration, function(err, res, result) {
        if(err) {
            logger.error('Error due to ', err);
            return cb(err);
        }

        return cb(err, result);
    });
}