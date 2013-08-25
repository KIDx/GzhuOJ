var cluster = require('cluster');
var os = require('os');

var numCPUs = os.cpus().length;

var workers = {};
if (cluster.isMaster) {
	cluster.on('death', function(worker){
		delete workers[worker.process.pid];
		worker = cluster.fork();
		workers[worker.process.pid] = worker;
	});
	for (var i = 0; i < numCPUs; i++) {
		var worker = cluster.fork();
		console.log(worker.process.pid);
		workers[worker.process.pid] = worker;
	}
} else {
	var app = require('./app');
	app.listen(3000);
	console.log("Server running at http://localhost:3000");
}

process.on('SIGTERM', function(){
	for (var pid in workers) {
		process.kill(pid);
	}
	process.exit(0);
});