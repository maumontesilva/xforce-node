/**
 * Created by maurosil on 24/03/2016.
 */

var async = require('async');
var RestfulService = require('../restful/restful.service');
var Log = require('log');
var logger = new Log('info');

var xfeEndpoints = {
  iprs: 'ipr',
  urls: 'url',
  vulnerabilities: 'vulnerabilities',
  casefiles: 'casefiles'
};

module.exports = function(RED) {
    function readXforce(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var username;
        var password;

        //Setting the node status as ready
        node.status({fill:"blue",shape:"dot",text:"ready"});
        if (this.credentials) {
            username = this.credentials.user;
            password = this.credentials.password;
        }

        //Registering a listener on the input event to receive messages from the up-stream nodes in a flow.
        this.on('input', function(msg) {
            //Setting the node status as running
            node.status({fill:"green",shape:"dot",text:"running"});

            var requestResult = [];
            var data = msg.payload[config.options];
            if(data && data.length && data.length > 0) {
                async.each(data, function(item, cb) {
                    var restfulService = new RestfulService('https', config.server, config.port, username, password);
                    restfulService.sendRequest('GET', xfeEndpoints[config.options] + '/' + item, null,
                                            function(error, result) {
                        if(error) {
                            cb(err);
                        } else {
                            requestResult.push(result);
                            cb();
                        }
                    });
                }, function(err, resp) {
                    if(err) {
                        //Setting the node status as failed
                        node.status({fill:"red",shape:"dot",text:"failed"});
                    }

                    sendNodeResponse(node, requestResult);
                });
            } else {
                sendNodeResponse([]);
            }
        });
    }

    function writeXforce(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var username;
        var password;

        //Setting the node status as ready
        node.status({fill:"blue",shape:"dot",text:"ready"});
        if (this.credentials) {
            username = this.credentials.user;
            password = this.credentials.password;
        }

        //Registering a listener on the input event to receive messages from the up-stream nodes in a flow.
        this.on('input', function(msg) {
            //Setting the node status as running
            node.status({fill:"green",shape:"dot",text:"running"});

            logger.debug('config ', config.server, config.port, username);
            var restfulService = new RestfulService('https', config.server, config.port, username, password);
            async.waterfall([
                function(callback) {
                    logger.debug('config.options: ', config.options);
                    logger.debug('xfeEndpoints[config.options]: ', xfeEndpoints[config.options]);
                    logger.debug('msg.payload: ', msg.payload);
                    restfulService.sendRequest('POST', xfeEndpoints[config.options], msg.payload, function(error, result) {
                        if(error) {
                            return callback(error);
                        } else {
                            if(!JSON.parse(result).caseFileID) {
                                return callback(result);
                            }

                            return callback(null, JSON.parse(result).caseFileID);
                        }
                    });
                },
                function(caseFileID, callback) {
                    restfulService.sendRequest('POST', xfeEndpoints[config.options] + '/' + caseFileID + '/createreports',
                                        msg.payload.contents, function(error, result) {
                        if(error) {
                            return callback(error);
                        } else {
                            return callback(null, result);
                        }
                    });
                }
            ], function(err, result) {
               if(err) {
                   //Setting the node status as failed
                   node.status({fill:"red",shape:"dot",text:"failed"});
               } else {
                   //Setting the node status as ready
                   node.status({fill:"blue",shape:"dot",text:"ready"});
               }
            });
        });
    }

    RED.nodes.registerType("xfeIn", readXforce, {
	      credentials: {
        	   user: {type:"text"},
        	   password: {type: "password"},
               name: {type:"text"}
		    }
      });

    RED.nodes.registerType("xfeOut", writeXforce, {
        credentials: {
            user: {type:"text"},
            password: {type: "password"},
            name: {type:"text"}
        }
    });
}

function sendNodeResponse(node, result) {
    var msg = {};

    msg.payload = result;
    //Setting the node status as ready
    node.status({fill:"blue",shape:"dot",text:"ready"});

    //Sending a message to the down-stream nodes in a flow
    node.send(msg);
}