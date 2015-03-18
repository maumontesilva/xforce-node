var request     = require('request');
var xml2js      = require('xml2js');

module.exports = function(RED) {
	function readIEM(config) {
		RED.nodes.createNode(this, config);
		var node = this;

		//Setting the node status as ready
                node.status({fill:"blue",shape:"dot",text:"ready"});

		if (this.credentials) {
	            this.user = this.credentials.user;
	            this.password = this.credentials.password;
	        }

		//Registering a listener on the input event to receive messages from the up-stream nodes in a flow.
		this.on('input', function(msg) {
		    //Setting the node status as running
                    node.status({fill:"green",shape:"dot",text:"running"});

                    var queryFiberLinkTestOptions = {
                        method: 'GET',
                        url: 'https://' + this.user + ':' + this.password + '@' + config.server + ':' + config.port + '/api/' + config.options,
                        rejectUnauthorized: false //FOR NOW DO NOT CONSIDER CERT
                    };

                    callIEMServer(queryFiberLinkTestOptions, function(error, result) {
                        if(error) {
		            //Setting the node status as failed
                            node.status({fill:"red",shape:"dot",text:"failed"});

                            console.log('ERROR: ' + error);
                        } else {
                            msg.payload = result;
                             //Setting the node status as ready
                             node.status({fill:"blue",shape:"dot",text:"ready"});

			    //Sending a message to the down-stream nodes in a flow
			    node.send(msg);
                        }
                    });
/*console.log("MAURO 01: " + JSON.stringify(config));
console.log("MAURO 02: " + this.user);
console.log("MAURO 03: " + this.password);
console.log("MAURO 04: " + JSON.stringify(msg));
console.log("MAURO 05: " + JSON.stringify(queryFiberLinkTestOptions));*/
		});
	}

	RED.nodes.registerType("iem", readIEM, {
	        credentials: {
        	    user: {type:"text"},
        	    password: {type: "password"}
		}
        });
}

function callIEMServer(queryFiberLinkTestOptions, callback) {
    request(queryFiberLinkTestOptions, function(err, res, body) {
        if (err) {
            callback(err, '');
        } else {
            var parser = new xml2js.Parser();
            parser.parseString(res.body, function (err, result) {
                if (err) {
                    callback(error, '');
                } else {
                    callback('', result);
                }
            });
        }
    });
}
