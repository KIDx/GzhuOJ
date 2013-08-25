/*
* Module dependencies.
*/
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var partials = require('express-partials');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var app = express();

var fs = require('fs');

//访问日志和错误日志
//var accessLogfile = fs.createWriteStream('access.log', {flags: 'a'});
var errorLogfile = fs.createWriteStream('error.log', {flags: 'a'});

//服务器配置
app.configure(function(){
  
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');

  app.use(partials());

  app.use(express.logger('dev'));
  //app.use(express.logger({stream: accessLogfile}));

  app.use(express.compress());    //使用gzip进行压缩传输
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.cookieParser());
  
  app.use(express.session({
    secret: settings.cookie_secret,
    store: new MongoStore({
      db: settings.db
    })
  }));

  app.use(app.router);
});
//设置环境: production, development
app.configure('development', function() {
  //使用静态资源服务以及设置缓存
  //app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'public'), {maxAge:86400000}));//, {maxAge:31557600000}));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  //若有错误，写入错误日志
  app.use(function(err, req, res, next){
    var meta = '[' + new Date() + '] ' + req.url + '\n';
    errorLogfile.write(meta + err.stack + '\n');
    next();
  });
});
/***********************server response***********************/
//主页
app.get('/', routes.index);
//user页面
app.get('/user/:name', routes.user);
//上传头像页面
app.get('/avatar', routes.avatar);
//addproblem页面
app.get('/addproblem', routes.addproblem);
app.post('/addproblem', routes.doAddproblem);
//addcontest页面
app.get('/addcontest', routes.addcontest);
app.post('/addcontest', routes.doAddcontest);
//登出
app.post('/logout', routes.logout);
//problemset面
app.get('/problemset', routes.problemset);
//problem页面
app.get('/problem', routes.problem);
//onecontest页面
app.get('/onecontest/:cid', routes.onecontest);
//status页面
app.get('/status', routes.status);
//ranklist页面
app.get('/ranklist', routes.ranklist);
//contest页面
app.get('/contest/:type', routes.contest);
//FAQ页面
app.get('/faq', routes.faq);
//submit页面及submit动作
app.get('/submit', routes.submit);
app.post('/submit', routes.doSubmit);
//sourcecode页面
app.get('/sourcecode/:runid', routes.sourcecode);
//statistic页面
app.get('/statistic/:pid', routes.statistic);
//regform页面
app.get('/regform/:type', routes.regCon);
app.post('/regform', routes.regCon);
/***********************jquery ajax***********************/
//注册
app.post('/doReg', routes.doReg);
//创建验证码
app.post('/createVerifycode', routes.createVerifycode);
//用户登录
app.post('/doLogin', routes.doLogin);
//登录私有比赛
app.post('/loginContest', routes.loginContest);
//检查用户是否存在
app.post('/getUsername', routes.getUsername);
//1.获取题目, addcontest.js引用;
//2.获取题目全部信息, onecontest.js引用, 并更新onecontest的会话:oneQ
app.post('/getProblem', routes.getProblem);
//删除一个比赛或课程
app.post('/contestDelete', routes.contestDelete);
//公有VIPContest的注册
app.post('/contestReg', routes.contestReg);
//注册报名私有VIPContest
app.post('/doRegCon', routes.doRegCon);
//更新私有VIPContest的报名结果，以及给审核通过用户赋予相应权限
app.post('/regUpdate', routes.regUpdate);
//get user's AC or not AC records
app.post('/getOverview', routes.getOverview);
//get a page of contest status
app.post('/getStatus', routes.getStatus);
//获取一组用户的权限信息
app.post('/getPrivilege', routes.getPrivilege);
//VIPContest的打星功能(管理员)
app.post('/toStar', routes.toStar);
//user页面的修改用户称号功能(队长以上)
app.post('/changePvl', routes.changePvl);
//user页面的修改用户加题权限功能(admin)
app.post('/changeAddprob', routes.changeAddprob);
//user页面的修改信息功能(setting)
app.post('/changeInfo', routes.changeInfo);
//编辑题目分类标签
app.post('/editTag', routes.editTag);
//题目代码文件上传功能(problem.ejs)
app.post('/problem', routes.upload);
//单题重判
app.post('/rejudge', routes.rejudge);
//VIPContest删除指定的已报名用户
app.post('/regContestDel', routes.regContestDel);
//VIPContest增加指定用户
app.post('/regContestAdd', routes.regContestAdd);
//修改某用户报名信息
app.post('/changeGrade', routes.changeGrade);
//上传图片
app.post('/imgUpload', routes.imgUpload);
//上传头像
app.post('/avatarUpload', routes.avatarUpload);
//上传数据
app.post('/dataUpload', routes.dataUpload);
//获取指定runID的CE信息
app.post('/getCE', routes.getCE);
//获取验证码
app.post('/getVerifycode', function(req, res){
  res.header('Content-Type', 'text/plain');
  res.end(req.session.verifycode);
});
//清除服务器消息
app.post('/msgClear', function(req, res){
  req.session.msg = null;
  res.end();
});
//connect mongodb
routes.connectMongodb();
//disconnect mongodb
app.on('close', function(err) {
  routes.disconnectMongodb();
});
//running server
if (!module.parent) {
  http.createServer(app).listen(app.get('port'), function(){
    console.log("Server running at http://localhost:3000");
  });
}

module.exports = app;