var cookie = require('express/node_modules/cookie');

module.exports = function(io, sessionStore) {
  io.adapter(require('socket.io-adapter-mongo')({ host: 'localhost', port: 27017, db: 'gzhu_db' }));

  //socket验证cookie并获取会话
  io.use(function(socket, next){
    var handshakeData = socket.request;
  	if (!handshakeData.headers.cookie) {
      return next(new Error('no cookie.'));
  	}
    handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
    var sid = handshakeData.cookie['connect.sid'];
    if (!sid) {
      return next(new Error('no sid.'));
    }
  	sessionStore.get(sid.split(':')[1].split('.')[0], function(err, session){
      if (err) {
        return next(err);
      }
  		if (!session) {
        return next('no session.');
  		}
      socket.session = session;
      next();
  	});
  });
  
  //socket连接
  io.sockets.on('connection', function(socket){
  	var session = socket.session;
  	if (session && session.user) {
  		socket.on('broadcast', function(data, fn){
  			if (data) {
  				var cid = parseInt(data.room, 10);
  				if (!cid) {
  					return ;	//not allow
  				}
  				var RP = function() {
  					socket.broadcast.to(data.room).emit('broadcast', data.msg);
            if (fn) {
              fn(true);
            }
  				};
  				if (session.user.name == 'admin') {
  					return RP();
  				}
  				Contest.watch(cid, function(err, con){
  					if (err) {
  						OE(err);
              if (fn) {
                fn(false);
              }
  						return ;
  					}
  					if (con && con.userName == session.user.name) {
  						return RP();
  					}
  				});
  			}
  		});
  	}
    //加入比赛房间
  	socket.on('login', function(room){
  		if (room) {
  			socket.join(room.toString());
  		}
  	});
  });
};
