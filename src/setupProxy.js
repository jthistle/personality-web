const proxy = require('http-proxy-middleware');

module.exports = function(app) {
	app.use(proxy('/graphql', 
	    { 
	    	target: 'http://192.168.0.9:4000/',
	    	changeOrigin: true
	    }
	));
}