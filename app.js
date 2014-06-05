/*
* Module dependencies.
*/
var express = require('express')
,	routes = require('./routes')
,	http = require('http')
,	path = require('path')
,	partials = require('express-partials')
,	session = require('express-session')
,	MongoStore = require('connect-mongo')(session)
,	settings = require('./settings')
,	OE = settings.outputErr
,	app = express()
,	server = http.createServer(app)
,	io = require('socket.io').listen(server)
,	fs = require('fs')
,	cookie = require('express/node_modules/cookie')
,	utils = require('connect/lib/utils')
,	sessionStore = new MongoStore({ db : settings.db })
,	Contest = require('./models/contest.js');

//服务器配置
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(partials());

app.use(require('morgan')('dev'));

app.use(require('body-parser')());
app.use(require('multer')({
	dest: './uploads/',
	rename: function(fieldname, filename) {
		return filename;
	}
}));
app.use(require('compression')()); 		//gzip压缩传输
app.use(require('method-override')());

app.use(require('cookie-parser')());
app.use(session({
	secret: settings.cookie_secret,
	store: sessionStore,
	cookie: { maxAge: 86400000 }
}));

app.use(express.static(__dirname+'/public', {maxAge: 259200000}));	//使用静态资源服务以及设置缓存(三天)
app.use(require('serve-favicon')(__dirname+'/public/favicon.ico', {maxAge: 2592000000}));

//#####server response
//主页
app.get('/', routes.index);
//user页面
app.get('/user/:name', routes.user);
//上传头像页面
app.get('/avatar', routes.avatar);
//addstudent页面
app.get('/addstudent', routes.addstudent);
//addproblem页面
app.get('/addproblem', routes.addproblem);
app.post('/addproblem', routes.doAddproblem);
//addcontest页面
app.get('/addcontest', routes.addcontest);
app.post('/addcontest', routes.doAddcontest);
//addcourse页面
app.get('/addcourse', routes.addcourse);
app.post('/addcourse', routes.doAddcourse);
//addtopic页面
app.get('/addtopic', routes.addtopic);
app.post('/addtopic', routes.doAddtopic);
//登出
app.post('/logout', routes.logout);
//problemset面
app.get('/problemset', routes.problemset);
//problem页面
app.get('/problem', routes.problem);
//题目代码文件上传功能
app.post('/problem', routes.upload);
//onecontest页面
app.get('/onecontest/:cid', routes.onecontest);
//onecourse页面
app.get('/onecourse/:id', routes.onecourse);
//status页面
app.get('/status', routes.status);
//ranklist页面
app.get('/ranklist', routes.ranklist);
//course Rank页面
app.get('/ranklist/:id', routes.courseRank);
//contest页面
app.get('/contest/:type', routes.contest);
//course页面
app.get('/course', routes.course);
//topic页面
app.get('/topic', routes.topic);
//onetopic页面
app.get('/topic/:id', routes.onetopic);
//submit页面及submit动作
app.get('/submit', routes.submit);
app.post('/submit', routes.doSubmit);
//sourcecode页面
app.get('/sourcecode/:runid', routes.sourcecode);
//statistic页面
app.get('/statistic/:pid', routes.statistic);
//regform页面
app.get('/regform/:type', routes.regCon);
app.get('*', function(req, res){
	res.render('404', {layout: null});
});

//#####jquery ajax
//注册
app.post('/doReg', routes.doReg);
//创建验证码
app.post('/createVerifycode', routes.createVerifycode);
//用户登录
app.post('/doLogin', routes.doLogin);
//登录私有比赛
app.post('/loginContest', routes.loginContest);
//1.获取题目, addcontest.js引用;
//2.获取题目全部信息, onecontest.js引用
app.post('/getProblem', routes.getProblem);
//删除一个比赛或考试
app.post('/contestDelete', routes.contestDelete);
//显示比赛的题目到problemset
app.post('/toggleHide', routes.toggleHide);
//删除一个课程
app.post('/courseDelete', routes.courseDelete);
//to change course's title
app.post('/changeCourseTitle', routes.changeCourseTitle);
//to change group's name
app.post('/changeGroupName', routes.changeGroupName);
//新建分组
app.post('/addGroup', routes.addGroup);
//删除分组
app.post('/delGroup', routes.delGroup);
//为分组添加题目
app.post('/addProbToGroup', routes.addProbToGroup);
//为分组删除题目
app.post('/delProbInGroup', routes.delProbInGroup);
//公有VIPContest的注册
app.post('/contestReg', routes.contestReg);
//用户提交注册报名私有VIPContest
app.post('/doRegCon', routes.doRegCon);
//更新私有VIPContest的报名结果，以及给审核通过用户赋予相应权限
app.post('/regUpdate', routes.regUpdate);
//get user's AC or not AC records
app.post('/getOverview', routes.getOverview);
//updateStatus
app.post('/updateStatus', routes.updateStatus);
//get a page of contest status
app.post('/getStatus', routes.getStatus);
//get a page of contest ranklist
app.post('/getRanklist', routes.getRanklist);
//get a page of contest discuss
app.post('/getTopic', routes.getTopic);
//add a discuss to contest Discuss
app.post('/addDiscuss', routes.addDiscuss);
//user页面，修改他人称号等重要信息(for admin)
app.post('/changePvl', routes.changePvl);
//user页面的修改他人加题权限功能(for admin)
app.post('/changeAddprob', routes.changeAddprob);
//user页面的修改信息功能(setting)
app.post('/changeInfo', routes.changeInfo);
//user页面将他人密码恢复默认, 即123456(for admin)
app.post('/restorePsw', routes.restorePsw);
//编辑题目分类标签
app.post('/editTag', routes.editTag);
//单题重判
app.post('/rejudge', routes.rejudge);
//VIPContest增加指定用户(for admin)
app.post('/regContestAdd', routes.regContestAdd);
//将指定用户从比赛中移除(for admin)
app.post('/regContestRemove', routes.regContestRemove);
//上传图片
app.post('/imgUpload', routes.imgUpload);
//上传头像
app.post('/avatarUpload', routes.avatarUpload);
//上传数据
app.post('/dataUpload', routes.dataUpload);
//上传csv文件
app.post('/csvUpload', routes.csvUpload);
//addstudent 批量注册
app.post('/reg', routes.reg);
//删除题目数据
app.post('/delData', routes.delData);
//删除题目图片
app.post('/delImg', routes.delImg);
//获取指定runID的CE信息
app.post('/getCE', routes.getCE);
//重新统计所有用户提交数和AC数
app.post('/recal', routes.recal);
//切换指定用户打星状态
app.post('/toggleStar', routes.toggleStar);
//切换话题置顶状态
app.post('/toggleTop', routes.toggleTop);
//修改指定题目的难度
app.post('/updateEasy', routes.updateEasy);
//添加回复
app.post('/review', routes.review);
//删除回复
app.post('/delComment', routes.delComment);
//编辑回复
app.post('/editComment', routes.editComment);

//清除服务器消息
app.post('/getMessage', function(req, res){
	res.header('Content-Type', 'text/plain');
	var msg = req.session.msg;
	req.session.msg = '';
	if (!msg)
		return res.end();
	return res.end(msg);
});

//课程排名查询会话（存储当前询问，刷新不变）
app.post('/courseRankSession', function(req, res){
	res.header('Content-Type', 'text/plain');
	if (!req.session.user || !req.session.user.privilege || req.session.user.privilege != '82') {
		return res.end();
	}
	var g = parseInt(req.body.g, 10), c = req.body.c;
	if (!g) {
		g = (new Date()).getFullYear() % 100;
		c = '';
	}
	if (g < 10) g = '0' + g;
	req.session.user.grade = g.toString()+c;
	return res.end();
});

//connect mongodb
routes.connectMongodb();
//disconnect mongodb
app.on('close', function(err){
	if (err) {
		OE(err);
	}
	routes.disconnectMongodb();
});

//running server
server.listen(app.get('port'), function(){
	console.log("Server running at http://localhost:3000");
});

//normal when use nginx
io.set('transports', [
  'xhr-polling',
  'jsonp-polling'
]);

//websocket设置session
io.set('authorization', function(handshakeData, accept){
	if (!handshakeData.headers.cookie) {
		return accept('no cookie.', false);
	}
	handshakeData.cookies = utils.parseSignedCookies(
			cookie.parse(handshakeData.headers.cookie),
			settings.cookie_secret);
	sessionStore.get(handshakeData.cookies['connect.sid'], function(err, session){
		if (err || !session) {
			return accept('no session.', false);
		}
		handshakeData.session = session;
		return accept(null, true);
	});
});

//socket
io.sockets.on('connection', function(socket){
	var session = socket.handshake.session;
	if (session && session.user) {
		socket.on('broadcast', function(data){
			if (data) {
				var cid = parseInt(data.room, 10);
				if (!cid) {
					return ;	//not allow
				}
				var RP = function() {
					socket.broadcast.to(data.room).emit('broadcast', data.msg);
				};
				if (session.user.name == 'admin') {
					return RP();
				}
				Contest.watch(cid, function(err, con){
					if (err) {
						OE(err);
						return ;
					}
					if (con && con.userName == session.user.name) {
						return RP();
					}
				});
			}
		});
	}
	socket.on('login', function(room){
		if (room) {
			socket.join(room.toString());
		}
	});
});