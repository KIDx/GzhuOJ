/*
~key~
-1: index
0: user
1: statistic
2: register
3: problemset
4: status
5: ranklist
6: contest
7: faq
8: problem
9: onecontest
10: submit
11: sourcecode
1000/1001: addproblem
1002: addcontest
*/

var crypto = require('crypto');
var User = require('../models/user.js');
var IDs = require('../models/ids.js');
var Solution = require('../models/solution.js');
var Problem = require('../models/problem.js');
var Contest = require('../models/contest.js');
var Reg = require('../models/reg.js');
var tCan = require('../models/can.js');
var fs = require('fs');

function deal(str) {
  var n = parseInt(str, 10);
  if (n < 10) return '0'+n;
  return n;
}

function getDate(date) {
  var Y = date.getFullYear();
  var M = date.getMonth()+1;
  if (M < 10) M = '0' + M;
  var D = date.getDate();
  if (D < 10) D = '0' + D;
  var h = date.getHours();
  if (h < 10) h = '0' + h;
  var m = date.getMinutes();
  if (m < 10) m = '0' + m;
  var s = date.getSeconds();
  if (s < 10) s = '0' + s;
  return (Y+'-'+M+'-'+D+' '+h+':'+m+':'+s);
}

function calDate(startTime, len) {
  var str = startTime.split(' ');
  var date = str[0].split('-');
  var time = str[1].split(':');
  var Y = date[0], M = date[1], D = date[2];
  var h = time[0], m = time[1];
  var newdate = new Date();
  newdate.setFullYear(Y); newdate.setMonth(M-1); newdate.setDate(D);
  newdate.setHours(h); newdate.setMinutes(m); newdate.setSeconds(0); newdate.setMilliseconds(0);
  newdate.setTime(newdate.getTime() + len*60000);
  return getDate(newdate);
}

function CheckEscape(ch) {
  if (ch == '$' || ch == '(' || ch == ')' || ch == '*' || ch == '+' ||
      ch == '.' || ch == '[' || ch == ']' || ch == '?' || ch == '\\' ||
      ch == '^' || ch == '^' || ch == '{' || ch == '}' || ch == '|')
    return true;
  return false;
}

function toEscape(str) {
  var res = '';
  for (var i = 0; i < str.length; i++) {
    if (CheckEscape(str.charAt(i))) res += '\\';
    res += str.charAt(i);
  }
  return res;
}

function clearHtml(str) {
  var res = '';
  for (var i = 0; i < str.length; i++) {
    var ch = str.charAt(i);
    if (ch == '<') res += '&lt';
    else if (ch == '>') res += '&gt';
    else res += ch;
  }
  return res;
}

function IsRegCon(s, name) {
  for (var i = 0; i < s.length; i++) {
    if (s[i].split(s[i].charAt(0))[1] == name)
      return true;
  }
  return false;
}

exports.connectMongodb = function() {
  Solution.connect(function(err){
    if (err) {
      console.log('connect failed');
      throw err;
    }
  });
};

exports.disconnectMongodb = function() {
  Solution.disconnect(function(err){
    if (err) {
      console.log('disconnect failed');
      throw err;
    }
  });
};

exports.getUsername = function(req, res) {
  if (!req.body.key) return res.end();
  res.header('Content-Type', 'text/plain');
  User.get(req.body.key, function(err, user){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (user) return res.end('1');
    res.end();
  });
};

exports.getStatus = function(req, res) {
  res.header('Content-Type', 'text/plain');
  Solution.watch({runID:req.body.key}, function(err, solution){
    if (err || !solution) {
      console.log('getStatus failed');
      return res.end();
    }
    var tp;
    if (!req.body.manager || req.session.user &&
      (req.session.user.name == solution.userName || req.session.user.name == req.body.manager)) {
      tp = solution.result+'-'+solution.time+'-'+solution.memory;
    }
    else tp = solution.result+'-x-x';
    res.end(tp);
  });
};

exports.getContestStatus = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var page = parseInt(req.body.page);
  var type = parseInt(req.body.type);
  if (!page) page = 1;
  if (req.body.all) page = -1;
  if (!req.session.oneQ) req.session.oneQ = {};
  req.session.oneQ[req.body.cid] = req.body.curl;
  Solution.get({cID:req.body.cid}, page, req.body.min_runid, req.body.pagenum, 0, function(err, solutions){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (type == 2) return res.json(solutions);
    var flg = false, has = {}, pattern = '^';
    solutions.forEach(function(p){
      if (!has[p.userName]) {
        if (flg) pattern += '|';
        else flg = true;
        has[p.userName] = true;
        pattern += '('+p.userName+')';
      }
    });
    pattern += '$';
    User.Find (0, {name: new RegExp(pattern)}, function(err, users){
      if (err) {
        console.log(err);
        return res.end();
      }
      solutions.push(users);
      res.json(solutions);
    });
  });
};

exports.getPrivilege = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var cid = parseInt(req.body.cid);
  if (!cid) {
    return res.end();
  }
  Contest.watch(cid, function(err, contest){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (!contest || contest.type != 2) {
      return res.end();
    }
    var key = 0, ary = new Array();
    if (contest.password) key = 1;
    if (contest.contestants) {
      contest.contestants.forEach(function(p){
        ary.push(p.split(p.charAt(0))[1]);
      });
    }
    ary.push(contest.userName);
    User.Find (key, {name: {$in: ary}}, function(err, users){
      if (err) {
        console.log(err);
        return res.end();
      }
      res.json([ary, users]);
    });
  });
};

exports.getCE = function(req, res) {
  if (!req.session.user)
    return res.end('Please login first!');
  Solution.watch({runID:req.body.rid}, function(err, solution){
    if (err) {
      console.log(err);
      return res.end('Server Error!');
    }
    if (req.session.user.name != 'admin' && req.session.user.name != solution.userName)
      return res.end('You have no permission to watch the Information!');
    return res.end(solution.CE);
  });
};

exports.changePvl = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (!req.session.user.privilege) {
    req.session.msg = 'Failed! You have no permission to do that!';
    return res.end();
  }
  var ch = req.session.user.privilege.charAt(0);
  if (ch <= req.body.pvl.charAt(0)) {
    req.session.msg = 'Failed! Your permission is not high enough!';
    return res.end();
  }
  User.get(req.body.name, function(err, user){
    if (err) {
      console.log(err);
      req.session.msg = err;
      return res.end();
    }
    if (user.privilege &&
      user.privilege.charAt(0) >= ch) {
      req.session.msg = 'Failed! Your permission is not high enough!';
      return res.end();
    }
    user.privilege = req.body.pvl;
    user.save(function(err){
      if (err) {
        console.log(err);
        return res.end();
      }
      req.session.msg = 'The Information has been changed successfully.';
      res.end();
    });
  });
};

exports.changeAddprob = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = 'Failed! You have no permission to do that!';
    return res.end();
  }
  User.get(req.body.name, function(err, user){
    if (err) {
      console.log(err);
      req.session.msg = err;
      return res.end();
    }
    if (!user.addprob) user.addprob = true;
    else user.addprob = false;
    user.save(function(err){
      if (err) {
        console.log(err);
        return res.end();
      }
      req.session.msg = 'The Information has been changed successfully.';
      res.end();
    });
  });
};

exports.changeInfo = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end('F');
  }
  if (req.session.user.name != req.body.name) {
    req.session.msg = 'Failed! You aren\'t '+req.body.name;
    return res.end('F');
  }

  var md5 = crypto.createHash('md5');
  var oldpassword = md5.update(req.body.oldpassword).digest('base64');

  User.get(req.body.name, function(err, user){
    if (err || !user) {
      if (!err) err = 'the user is not exist.';
      console.log(err);
      req.session.msg = err;
      return res.end('F');
    }
    if (oldpassword != user.password)
      return res.end('T');

    if (req.body.password) {
      var tmd = crypto.createHash('md5');
      user.password = tmd.update(req.body.password).digest('base64');
    }
    user.nick = req.body.nick;
    if (req.body.school) user.school = req.body.school;
    if (req.body.email) user.email = req.body.email;
    if (req.body.signature) user.signature = req.body.signature;
    user.save(function(err){
      if (err) {
        console.log(err);
        req.session.msg = err;
      } else req.session.msg = 'Your Information has been updated successfully.';
      res.end('F');
    });
  });
};

exports.getProblem = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (req.body.curl) {
    if (!req.session.oneQ) req.session.oneQ = {};
    req.session.oneQ[req.body.cid] = req.body.curl;
  }
  if (!req.body.pid) return res.end();
  Problem.watch(req.body.pid, function(err, problem){
    if (err)
      return res.end();
    if (req.body.all)
      return res.json(problem);
    if (problem.hide == true &&
      (!req.session.user || (req.session.user.name != 'admin' && req.session.user.name != problem.manager)))
      return res.end();
    res.end(problem.title);
  });
};

exports.editTag = function(req, res) {
  if (!req.session.user)
    return res.end();
  var pid = parseInt(req.body.pid);
  var tag = parseInt(req.body.tag);
  if (!pid || !tag)
    return res.end();
  var name = req.session.user.name;
  Solution.watch({problemID:pid, userName:name, result:2}, function(err, solution) {
    if (err) {
      console.log(err);
      return res.end();
    }
    if (!solution && name != 'admin')
      return res.end();
    var Q;
    if (req.body.add) Q = {$addToSet: {tags:tag}};
    else Q = {$pull: {tags:tag}};
    Problem.update(req.body.pid, Q, function(err, problem){
      if (err) {
        console.log(err);
        return res.end();
      }
      if (req.body.add) req.session.msg = 'Tag has been added to the problem successfully.';
      else req.session.msg = 'Tag has been removed from the problem successfully.';
      res.end();
    });
  });
};

exports.doReg = function(req, res) {
  //生成密码的散列值
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('base64');

  var newUser = new User({
    name: req.body.username,
    password: password,
    regTime: getDate(new Date()),
    nick: req.body.nick,
    school: req.body.school,
    email: req.body.email,
    signature: clearHtml(req.body.signature)
  });

  newUser.save(function(err) {
    if (err) {
      console.log(err);
      return res.end();
    }
    req.session.user = newUser;
    req.session.msg = 'Welcome, '+newUser.name+'. :)';
    res.end();
  });
};

exports.doLogin = function(req, res) {
  res.header('Content-Type', 'text/plain');
  //生成密码散列值
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('base64');
  User.get(req.body.username, function(err, user) {
    if (!user)
      return res.end('1');
    if (user.password != password)
      return res.end('2');
    if (!user.addprob) user.addprob = 0;
    else user.addprob = 1;
    req.session.user = user;
    req.session.msg = 'Welcome, '+user.shopName+'. :)';
    res.end('3');
  });
};

exports.loginContest = function(req, res) {
  res.header('Content-Type', 'text/plain');
  Contest.watch(req.body.cid, function(err, contest){
    if (err) {
      console.log(err);
      return res.end();
    }
    var md5 = crypto.createHash('md5');
    password = md5.update(req.body.password).digest('base64');
    if (password == contest.password) {
      if (!req.session.cid) req.session.cid = {};
      req.session.cid[req.body.cid] = true;
      return res.end('1');
    }
    res.end();
  });
};

exports.createVerifycode = function(req, res) {
  res.header('Content-Type', 'text/plain');
  tCan.Can (function(vcode, html){
    req.session.verifycode = vcode;
    res.end(html);
  });
};

exports.contestDelete = function(req, res) {
  Contest.dele(req.body.cid, function(err){
    if (err) {
      req.session.msg = err;
    } else {
      req.session.msg = 'Contest '+req.body.cid+' has been deleted successfully.';
    }
    res.end();
  });
};

exports.upload = function(req, res) {
  var path = req.files.info.path;
  var sz = req.files.info.size;
  if (sz < 50 || sz > 65535) {
    fs.unlink(path, function(err) {
      if (err) {
        console.log(err);
        return res.end();
      }
      if (sz < 50) req.session.msg = 'Failed! Field should contain no less than 50 characters';
      else req.session.msg = 'Failed! Field should contain no more than 65535 characters';
      res.redirect(req.url);
    });
  } else {
    fs.readFile(path, 'utf8', function(err, data){
      if (err) {
        console.log(err);
        return res.end();
      }
      fs.unlink(path, function(err) {
        if (err) {
          console.log(err);
          return res.end();
        }
        var pid = parseInt(req.query.pID);
        if (!pid) {
          req.session.msg = 'pid Error!';
          return res.redirect('/');
        }
        if (!req.session.user) {
          req.session.msg = 'Failed! Please login first!';
          return res.redirect('/problem?pID='+pid);
        }
        IDs.get ('runID', function(err, id){
          if (err) {
            console.log(err);
            return res.end();
          }
          var newSolution = new Solution({
            runID: id,
            problemID: pid,
            userName: req.session.user.name,
            inDate: getDate(new Date()),
            language: req.body.lang,
            length: sz,
            cID: -1,
            code: data
          });
          newSolution.save(function(err){
            if (err) {
              console.log(err);
              return res.redirect('/');
            }
            Problem.update(pid, {$inc: {submit: 1}});
            req.session.msg = 'The code for problem '+pid+' has been submited successfully.';
            res.redirect('/status');
          });
        });
      });
    });
  }
};

exports.marquee = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.body.cid) return res.end();
  Contest.watch (req.body.cid, function(err, contest) {
    if (err) {
      console.log(err);
      return res.end();
    }
    res.end(contest.msg);
  });
};

exports.rejudge = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  var pid = parseInt(req.body.pid);
  if (!pid) return res.end();
  Problem.watch(pid, function(err, problem) {
    if (err) {
      console.log(err);
      return res.end();
    }
    if (req.session.user.name != 'admin' && req.session.user.name != problem.manager) {
      if (!req.body.cid) {
        req.session.msg = 'Failed! You have no permission to Rejudge.';
        return res.end();
      }
      return res.end('0');
    }
    var has = {};
    Problem.update(pid, {$set: {AC: 0}}, function(err){
      if (err) {
        console.log(err);
        return res.end();
      }
      Solution.getDistinct('userName', {problemID:pid, result:2}, function(err, solutions){
        if (err) {
          console.log(err);
          return res.end();
        }
        User.update({'name': {$in: solutions}}, {$inc: {solved:-1}}, function(err){
          if (err) {
            console.log(err);
            return res.end();
          }
          Solution.update({problemID:pid}, {$set: {result:0}}, function(err){
            if (err) {
              console.log(err);
              return res.end();
            }
            if (!req.body.cid) {
              req.session.msg = 'Problem '+pid+' has been Rejudged successfully!';
              return res.end();
            }
            return res.end('1');
          });
        });
      });
    });
  });
};

function resetPassword() {
  /*if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = '你的权限不足';
    return res.end();
  }*/
  //if (!req.body.name) return res.end('The user is not exist.');
  User.get('1206100021', function(err, user){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (!user) return ;//return res.end('The user is not exist.');
    var md5 = crypto.createHash('md5');
    var password = md5.update('gzhuacm').digest('base64');
    user.password = password;
    user.save(function(err){
      if (err) {
        console.log(err);
        //return res.end();
      }
      //return res.end('Reset complete.');
    });
  });
};

//重新统计用户提交数和AC数
function recalAfterClear() {
  User.update({}, {$set: {submit:0, solved:0}}, function(err){
    if (err) {
      console.log(err);
    }
    User.All(function(err, users){
      users.forEach(function(user){
        Solution.Count({userName:user.name}, function(err, submitN){
          if (err) {
            console.log(err);
          }
          Solution.getDistinct('problemID', {userName:user.name, result:2}, function(err, docs){
            if (err) {
              console.log(err);
            }
            user.submit = submitN;
            if (docs) user.solved = docs.length;
            else user.solved = 0;
            user.save(function(err){
              if (err) {
                console.log(err);
              }
            });
          });
        });
      });
    });
  });
}

//清空数据库
function deleteAllData() {
  Contest.del(); IDs.del(); Problem.del();
  Reg.del(); Solution.del(); User.del();
}

exports.index = function(req, res){
  //resetPassword();
  //IDs.Init();
  //recalAfterClear();
  //deleteAllData();
  //Problem.change();
  res.render('index', { title: 'Gzhu Online Judge',
                        user: req.session.user,
                        message: req.session.msg,
                        time: (new Date()).getTime(),
                        key: -1
  });
};

exports.user = function(req, res) {
  var name = req.params.name;
  if (!name)
    return res.end('the user is not exist.');
  User.get (name, function(err, user){
    if (err) {
      req.session.msg = err;
      return res.redirect('/');
    }
    if (!user)
      return res.end('the user is not exist.');
    Solution.Find(name, function(err, solutions) {
      if (err) {
        req.session.msg = err;
        return res.redirect('/');
      }
      var A = new Array(), B = new Array(), AC = {}, WA = {};
      solutions.forEach(function(p){
        if (p.result == 2 && !AC[p.problemID]) {
          A.push(p.problemID);
          AC[p.problemID] = true;
        }
      });
      solutions.forEach(function(p){
        if (p.result != 2 && !AC[p.problemID] && !WA[p.problemID]) {
          B.push(p.problemID);
          WA[p.problemID] = true;
        }
      });
      User.getRank(name, function(err, rank){
        if (err) {
          req.session.msg = err;
          return res.redirect('/');
        }
        user.rank = rank;
        if (!user.addprob) user.addprob = 0;
        else user.addprob = 1;
        res.render('user', {title: 'User',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            key: 0,
                            u: user,
                            A: A.sort(),
                            B: B.sort()
        });
      });
    });
  });
};

exports.addcontest = function(req, res) {
  var type = parseInt(req.query.type);
  if (!type || type < 1 || type > 3)
    return res.end('cannot GET this page.');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.redirect('/contest?type='+type);
  }
  tcid = parseInt(req.query.cID);
  if (!tcid) {
    if (type == 2 && req.session.user.name != 'admin') {
      req.session.msg = 'You have no permission to add VIP Contest!';
      return res.redirect('/contest?type=2');
    }
    res.render('addcontest', {title: 'AddContest',
                              user: req.session.user,
                              message: req.session.msg,
                              time: (new Date()).getTime(),
                              contest: null,
                              key: 1002,
                              date: getDate(new Date()).split(' ')[0],
                              clone: 0,
                              type: type
    });
  } else {
    var clone = 0;
    if (tcid < 0) {
      clone = 1;
      tcid = -tcid;
    }
    Contest.watch (tcid, function(err, contest){
      if (err || !contest) {
        return res.redirect('/contest?type='+type);
      }
      if (contest && clone == 0 && req.session.user.name != contest.userName) {
        req.session.msg = 'You are not the manager of this contest!';
        return res.redirect('/onecontest?cID='+tcid);
      }
      if (clone == 1 && (!req.session.user || req.session.user.name != contest.userName)) {
        if ((contest.type != 2 && contest.password) ||
          getDate(new Date()) <= calDate(contest.startTime, contest.len)) {
            req.session.msg = 'Error! Illegal operation!';
          return res.redirect('/contest?type='+type);
        }
      }
      res.render('addcontest', {title: 'AddContest',
                                user: req.session.user,
                                message: req.session.msg,
                                time: (new Date()).getTime(),
                                contest: contest,
                                key: 1002,
                                date: getDate(new Date()).split(' ')[0],
                                clone: clone
      });
    });
  }
};

exports.doAddcontest = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var type = parseInt(req.body.type);
  if (!req.session.user) {
    req.session.msg = 'Failed! Please login first!';
    return res.end('/contest?type='+type);
  }
  if (type == 2 && req.session.user.name != 'admin') {
    req.session.msg = 'Failed! You have no permission to add VIP Contest!';
    return res.end('/contest?type=2');
  }
  var cnt = req.body.cnt;
  var password = '';
  if (type == 2) password = req.body.cpassword;
  else if (req.body.cpassword) {
    var md5 = crypto.createHash('md5');
    password = md5.update(req.body.cpassword).digest('base64');
  }
  var newContest = new Contest({
    title: req.body.ctitle,
    startTime: req.body.cdate+' '+deal(req.body.chour)+':'+deal(req.body.cminute),
    len: parseInt(req.body.cDay)*1440+parseInt(req.body.cHour)*60+parseInt(req.body.cMinute),
    description: req.body.Description,
    msg: req.body.Announcement,
    password: password
  });
  var cid = parseInt(req.body.cid);
  if (cid >= 1000) {
    if (!req.session.user || req.session.user.name != req.body.manager) {
      req.session.msg = 'Update Failed! You are not the manager!';
      return res.end('/onecontest?cID='+cid);
    }
    newContest.contestID = cid;
    Contest.watch(cid, function(err, doc) {
      if (!doc) err = 'Can not find contest ' + cid;
      if (err) {
        console.log(err);
        return res.end('/');
      }
      doc.title = newContest.title;
      doc.startTime = newContest.startTime;
      doc.len = newContest.len;
      doc.description = newContest.description;
      doc.msg = newContest.msg;
      doc.probs =  req.body.ary.slice(0);
      doc.password = newContest.password;
      doc.save(function(err){
        if (err) {
          console.log(err);
          return res.end('/');
        }
        var cstr = 'Contest';
        if (type == 3) cstr = 'Course';
        req.session.msg = 'Your '+cstr+' has been updated successfully.';
        res.end('/onecontest?cID='+cid);
      });
    });
  } else {
    IDs.get ('contestID', function(err, id) {
      if (err) {
        console.log(err);
        return res.end('/');
      }
      newContest.contestID = id;
      newContest.userName = req.session.user.name;
      newContest.probs = req.body.ary.slice(0);
      newContest.type = type;
      newContest.save(function(err) {
        if (err) {
          console.log(err);
          return res.end('/');
        }
        var cstr = 'Contest';
        if (type == 3) cstr = 'Course';
        req.session.msg = 'Your '+cstr+' has been added successfully.';
        res.end('/onecontest?cID='+id);
      });
    });
  }
};

exports.addproblem = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.redirect('/');
  }
  if (!req.session.user.addprob) {
    req.session.msg = 'You have no permission to Add or Edit problem!';
    return res.redirect('/');
  }
  var tk = 1000, tpid = parseInt(req.query.pID);
  if (!tpid) {
    res.render('addproblem', { title: 'addproblem',
                               user: req.session.user,
                               message: req.session.msg,
                               time: (new Date()).getTime(),
                               problem: null,
                               key: tk
    });
  } else {
    Problem.watch (tpid, function(err, problem){
      if (err) {
        req.session.msg = err;
        return res.redirect('/');
      }
      if (problem) {
        if (problem.hide == true && req.session.user.name != 'admin' && req.session.user.name != problem.manager) {
          req.session.msg = 'You have no permission to edit this hidden problem!';
          return res.redirect('/')
        }
        ++tk;
      }
      res.render('addproblem', { title: 'addproblem',
                                 user: req.session.user,
                                 message: req.session.msg,
                                 time: (new Date()).getTime(),
                                 problem: problem,
                                 key: tk
      });
    });
  }
};

exports.doAddproblem = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.redirect('/');
  }
  if (!req.session.user.addprob) {
    req.session.msg = 'Failed! You have no permission to Add or Edit problem.';
    return res.redirect('/');
  }
  var title = req.body.Title;
  if (!title) title = 'NULL';
  var newProblem = new Problem({
    problemID: -1,
    title: title,
    description: req.body.Description,
    input: req.body.Input,
    output: req.body.Output,
    sampleInput: req.body.sInput,
    sampleOutput: req.body.sOutput,
    hint: req.body.Hint,
    source: req.body.Source,
    spj: req.body.isSpj,
    timeLimit: req.body.Timelimit,
    memoryLimit: req.body.Memorylimit,
    hide: req.body.hide
  });
  if (req.session.user.name != 'admin')
    newProblem.manager = req.session.user.name;
  var pid = parseInt(req.body.pid);
  if (pid) {
    newProblem.problemID = pid,
    newProblem.save(1, function(err) {
      if (err) {
        req.session.msg = err;
        return res.redirect('/addproblem');
      }
      req.session.msg = 'Problem '+pid+' has been updated successfully.';
      res.redirect('/problem?pID='+pid);
    });
  } else {
    IDs.get ('problemID', function(err, id) {
      if (err) {
        req.session.msg = err;
        return res.redirect('/addproblem');
      }
      newProblem.problemID = id;
      newProblem.save(2, function(err) {
        if (err) {
          req.session.msg = err;
          return res.redirect('/addproblem');
        }
        fs.mkdir('../OJ/judge/data/'+id);
        req.session.msg = 'Problem '+id+' has been created successfully.';
        res.redirect('/problem?pID='+id);
      });
    });
  }
};

exports.imgUpload = function(req, res) {
  var path = req.files.info.path;
  var sz = req.files.info.size;
  res.header('Content-Type', 'text/plain');
  if (sz > 1024*1024) {
    fs.unlink(path, function(err) {
      if (err) {
        console.log(err);
        return res.end();
      }
      res.end('1');
    });
  } else if (req.files.info.type.split('/')[0] != 'image') {
    fs.unlink(path, function(err) {
      if (err) {
        console.log(err);
        return res.end();
      }
      res.end('2');
    });
  } else {
    fs.readFile(path, function(err, data){
      if (err) {
        console.log(err);
        return res.end();
      }
      fs.unlink(path, function(err) {
        if (err) {
          console.log(err);
          return res.end();
        }
        if (!req.session.user) {
          req.session.msg = '你的权限不足';
          return res.end('3');
        }
        var name = req.session.user.name;
        User.get(name, function(err, user) {
          if (err) {
            console.log(err);
            return res.end();
          }
          if (!user || !user.addprob) {
            req.session.msg = '你的权限不足';
            return res.end('3');
          }
          fs.writeFile('public/img/prob/'+req.files.info.name, data, function(err){
            if (err) {
              console.log(err);
              res.end();
            }
            res.end('0');
          });
        });
      });
    });
  }
};

exports.dataUpload = function(req, res) {
  var pid = parseInt(req.query.pID);
  if (!pid)
    return res.end();
  var pin = req.files.in.path;
  var pout = req.files.out.path;
  var sin = req.files.in.name;
  var sout = req.files.out.name;
  var tin = '', tout = '', i, lin = sin.length-3, lout = sout.length-4;
  for (i = 0; i < lin; i++) tin += sin.charAt(i);
  for (i = 0; i < lout; i++) tout += sout.charAt(i);
  if (tin != tout)
    return res.end('1');
  fs.readFile(pin, function(err, data){
    if (err) {
      console.log(err);
      return res.end();
    }
    fs.unlink(pin, function(err) {
      if (err) {
        console.log(err);
        return res.end();
      }
      if (!req.session.user) {
        req.session.msg = '你的权限不足';
        return res.end('3');
      }
      var name = req.session.user.name;
      User.get(name, function(err, user) {
        if (err) {
          console.log(err);
          return res.end();
        }
        if (!user || !user.addprob) {
          req.session.msg = '你的权限不足';
          return res.end('3');
        }
        fs.writeFile('../OJ/judge/data/'+pid+'/'+sin, data, function(err){
          if (err) {
            console.log(err);
            res.end();
          }
          fs.readFile(pout, function(err, data){
            if (err) {
              console.log(err);
              return res.end();
            }
            fs.unlink(pout, function(err) {
              if (err) {
                console.log(err);
                return res.end();
              }
              fs.writeFile('../OJ/judge/data/'+pid+'/'+sout, data, function(err){
                if (err) {
                  console.log(err);
                  res.end();
                }
                res.end('0');
              });
            });
          });
        });
      });
    });
  });
};

exports.logout = function(req, res) {
  if (!req.session.user)
    return res.end();
  req.session.msg = 'Goodbye, '+req.session.user.name+'. Looking forward to seeing you at GzhuOnlineJudge.';
  req.session.user = null;
  req.session.cid = null;
  res.end();
};

exports.problem = function(req, res) {
  var pid = parseInt(req.query.pID);
  if (!pid) {
    res.render('problem', {title: 'Problem',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            key: -1,
                            problem: null
    });
  } else {
    var name = '';
    if (req.session.user) name = req.session.user.name;
    Solution.watch({problemID:pid, userName:name, result:2}, function(err, solution) {
      if (err) {
        console.log(err);
      }
      var pvl = 0;
      if (solution) pvl = 1;
      Problem.watch(pid, function(err, problem) {
        if (err || (problem && (problem.hide == true &&
          (!req.session.user || (req.session.user.name != 'admin' && req.session.user.name != problem.manager))))) {
          problem = null;
        }
        if (pvl == 0 && (name == 'admin' || (problem && problem.manager == name))) pvl = 1;
        res.render('problem', { title: 'Problem '+pid,
                                user: req.session.user,
                                message: req.session.msg,
                                time: (new Date()).getTime(),
                                key: 8,
                                problem: problem,
                                pvl: pvl
        });
      });
    });
  }
}

exports.problemset = function(req, res) {
  var page = parseInt(req.body.page);

  if (!page) {
    res.render('problemset', {title: 'ProblemSet',
                              user: req.session.user,
                              message: req.session.msg,
                              time: (new Date()).getTime(),
                              key: 3,
                              Q: req.session.probQ
    });
    return ;
  }
  
  req.session.probQ = req.body;

  var q1 = {}, q2 = {}, tQ,
    str = req.session.probQ.search, tag = req.session.probQ.tag;
  if (str) {
    q1.title = new RegExp("^.*"+toEscape(str)+".*$", 'i');
  }
  if (tag  && tag.length > 0) {
    for (var i = 0; i < tag.length; i++)
      tag[i] = parseInt(tag[i]);
    q2.tags = {$in: tag};
  } else {
    q2.tags = {$in: [-1]};
  }
  if (!req.session.user) {
    tQ = {$and: [ {$or:[q1, q2]}, {hide:false} ]};
  } else if (req.session.user.name != 'admin') {
    tQ = {$and: [ {$or:[q1, q2]}, {$or:[{hide:false}, {manager:req.session.user.name}]} ]};
  } else tQ = {$or:[q1, q2]};
  Problem.get (tQ, {problemID:1}, page, req.body.pagenum, function(err, problems, n) {
    if (err) {
      console.log(err);
      return res.end();
    }
    if (!req.session.user) {
      problems.push(n);
      problems.push({});
      return res.json(problems);
    }
    var pids = new Array();
    problems.forEach(function(p){
      pids.push(p.problemID);
    });
    Solution.FindOut({$and: [{problemID: {$in:pids}}, {userName:req.session.user.name}] }, function(err, probs) {
      if (err) {
        console.log(err);
        return res.end();
      }
      problems.push(n);
      problems.push(probs);
      res.json(problems);
    });
  });
};

exports.status = function(req, res) {
  var page = parseInt(req.body.page);
  if (!page) {
    res.render('status', {title: 'Status',
                          user: req.session.user,
                          message: req.session.msg,
                          time: (new Date()).getTime(),
                          key: 4,
                          name: req.query.user,
                          pid: parseInt(req.query.pID),
                          result: parseInt(req.query.result)
    });
    return ;
  }

  var q = {};
  var str = req.body.search;
  if (str) q.userName = new RegExp("^.*"+toEscape(str)+".*$", 'i');
  str = parseInt(req.body.pid);
  if (str) q.problemID = str;
  var what = parseInt(req.body.what);
  if (what >= 0) q.result = what;
  var cid = parseInt(req.body.cid);
  if (cid) {
    q.cID = cid;
    req.session.oneQ[req.body.cid] = 'status';
    if (!req.session.user || req.session.user.name != 'admin')
      q.$nor = [{userName:'admin'}];
  }
  Solution.get (q, page, -1, req.body.pagenum, 1, function(err, solutions, n) {
    if (err) {
      console.log(err);
      return res.end();
    }
    var flg = false, has = {}, pattern = '^';
    solutions.forEach(function(p){
      if (!has[p.userName]) {
        if (flg) pattern += '|';
        else flg = true;
        has[p.userName] = true;
        pattern += '('+p.userName+')';
      }
    });
    pattern += '$';
    User.Find (0, {name: new RegExp(pattern)}, function(err, users){
      if (err) {
        console.log(err);
        return res.end();
      }
      solutions.push(n);
      solutions.push(users);
      res.json(solutions);
    });
  });
};

exports.onecontest = function(req, res) {
  var cid = parseInt(req.query.cID);
  if (!cid) {
    res.render('onecontest', {title: 'OneContest',
                              user: req.session.user,
                              message: req.session.msg,
                              time: (new Date()).getTime(),
                              key: -1,
                              contest: null,
                              curl: null
    });
  } else {
    Contest.watch (cid, function(err, contest) {
      if (err) {
        console.log(err);
        contest = null;
      } else {
        if (contest.type != 2) {
          if (contest.password) {
            if (!req.session.user || req.session.user.name != contest.userName) {
              if (!req.session.cid || !req.session.cid[cid]) {
                req.session.msg = 'you should login the contest '+cid+' first!';
                return res.redirect('/contest?type='+contest.type);
              }
            }
          }
        }
      }
      var curl;
      if (req.session.oneQ)
        curl = req.session.oneQ[cid];
      res.render('onecontest', {title: 'OneContest',
                                user: req.session.user,
                                message: req.session.msg,
                                time: (new Date()).getTime(),
                                key: 9,
                                contest: contest,
                                curl: curl
      });
    });
  }
};

exports.contest = function(req, res) {
  var page = parseInt(req.body.page);
  var type = parseInt(req.query.type);
  if (!type || type < 1 || type > 3) type = 1;

  if (!page) {
    res.render ('contest', {title: 'Contest',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            key: 6,
                            Q: req.session['conQ'+type],
                            type: type
    });
    return ;
  }
  
  req.session['conQ'+type] = req.body;

  var q = {type: type}, str = req.body.search;
  if (str) {
    q.title = new RegExp("^.*"+toEscape(str)+".*$", 'i');
  }

  var sq = { startTime:-1 };

  Contest.get (q, sq, page, req.body.pagenum, function(err, contests, n) {
    if (err) {
      console.log(err);
      return res.end();
    }
    var currentTime = getDate(new Date());
    var cons = new Array();
    contests.forEach(function(p){
      //只需判断有无密码, 不用传送整个密码过去, 减少数据传送
      var tp = {
        contestID: p.contestID,
        len: p.len,
        startTime: p.startTime,
        title: p.title,
        userName: p.userName
      };
      if (p.password) tp.password = '1';
      if (req.session.user && p.contestants.length > 0 && IsRegCon(p.contestants, req.session.user.name))
          tp.flg = '1';
      cons.push(tp);

    });
    cons.push(n);
    res.json(cons);
  });
};

exports.ranklist = function(req, res) {
  var page = parseInt(req.body.page);
  if (!page) {
    res.render('ranklist', {title: 'Ranklist',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            key: 5,
                            Q: req.session.rankQ
    });
    return ;
  }

  req.session.rankQ = req.body;

  var q = {};
  var str = req.body.search;
  if (str) {
    q.name = new RegExp("^.*"+toEscape(str)+".*$", 'i');
  }

  User.getAll (q, page, req.body.pagenum, function(err, users, n){
    if (err) {
      console.log(err);
      return res.end();
    }
    users.push(n);
    res.json(users);
  });
};

exports.faq = function(req, res) {
  res.render ('faq', {title: 'F.A.Qs',
                      user: req.session.user,
                      message: req.session.msg,
                      time: (new Date()).getTime(),
                      key: 7
  });
};

exports.submit = function(req, res) {
  res.render('submit', {title: 'Submit',
                        user: req.session.user,
                        message: req.session.msg,
                        time: (new Date()).getTime(),
                        key: 10,
                        id: req.query.pID
  });
};

exports.doSubmit = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end('1');
  }
  var cid = parseInt(req.body.cid);
  var name = req.session.user.name;
  if (!cid) cid = -1;
  var pid = parseInt(req.body.pid);
  var Str = req.body.code;
  Contest.watch(cid, function(err, contest){
    if (err) {
      console.log(err);
      return res.end();
    }
    IDs.get ('runID', function(err, id){
      if (err) {
        console.log(err);
        return res.end();
      }
      if (contest && contest.type == 2 && name != contest.userName) {
        if (!contest.contestants || !IsRegCon(contest.contestants, name)) {
          req.session.msg = 'You can not submit because you have not registered the contest yet!';
          return res.end('2');
        }
      }
      var newSolution = new Solution({
        runID: id,
        problemID: pid,
        userName: name,
        inDate: getDate(new Date()),
        language: req.body.lang,
        length: Str.length,
        cID: cid,
        code: Str
      });
      newSolution.save(function(err){
        if (err) {
          console.log(err);
          return res.end('3');
        }
        Problem.update(pid, {$inc: {submit: 1}}, function(err){
          if (err) {
            console.log(err);
            return res.end('3');
          }
          User.update({'name': name}, {$inc: {submit: 1}}, function(err){
            if (err) {
              console.log(err);
              return res.end('3');
            }
            if (cid < 0)
              req.session.msg = 'The code for problem '+pid+' has been submited successfully.';
            res.end();
          });
        });
      });
    });
  });
};

exports.sourcecode = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.redirect('/');
  }
  var runid = parseInt(req.query.runID);
  if (!runid)
    return res.end('the solution is not exit!');
  Solution.watch({runID:runid}, function(err, solution) {
    if (err) {
      console.log(err);
    }
    if (solution && req.session.user.name != solution.userName && req.session.user.name != 'admin') {
      Contest.watch(solution.cID, function(err, doc){
        if (err) {
          console.log(err);
        }
        if (doc && doc.userName == req.session.user.name) {
          res.render('sourcecode', {title: 'Sourcecode',
                                    user: req.session.user,
                                    message: req.session.msg,
                                    time: (new Date()).getTime(),
                                    key: 11,
                                    solution: solution
          });
          return ;
        }
        req.session.msg = 'You have no permission to see this code!';
        return res.redirect('/');
      });
    } else {
      res.render('sourcecode', {title: 'Sourcecode',
                                user: req.session.user,
                                message: req.session.msg,
                                time: (new Date()).getTime(),
                                key: 11,
                                solution: solution
      });
    }
  });
};

exports.statistic = function(req, res) {
  var pid = parseInt(req.query.pID);
  if (!pid)
    return res.end('the problem statistic is not exist!');
  Problem.watch(pid, function(err, problem){
    if (err || !problem) {
      if (err) console.log(err);
      return res.end('the problem statistic is not exist!');
    }
    res.render('statistic', { title: 'Problem Statistic',
                              user: req.session.user,
                              message: req.session.msg,
                              time: (new Date()).getTime(),
                              key: 1,
                              pid: pid
    });
  });
};

exports.doStatistic = function(req, res) {
  var sort_key = parseInt(req.body.sort), sq = {};
  if (sort_key == 1) {
    sq.time = 1;
    sq.memory = 1;
    sq.length = 1;
    sq.inDate = 1;
  } else if (sort_key == 2) {
    sq.memory = 1;
    sq.time = 1;
    sq.length = 1;
    sq.inDate = 1;
  } else {
    sq.length = 1;
    sq.time = 1;
    sq.memory = 1;
    sq.inDate = 1;
  }
  var page = parseInt(req.body.page);
  var pagenum = parseInt(req.body.pagenum);
  var a = (page-1)*pagenum, b = page*pagenum;
  var what = parseInt(req.body.search);
  Solution.statis(req.body.pid, sq, function(err, solutions){
    if (err) {
      console.log(err);
      return res.end();
    }
    var sols = new Array();
    var id = [0,0,0,0,0,0,0,0], I = 0, has = {};
    var names = new Array();
    var flg = false, pattern = '^';
    solutions.forEach(function(p){
      if (!req.body.amount) {
        switch (p.result) {
          case 0: break;
          case 1: break;
          case 2: {++id[0]; break;}
          case 3: {++id[2]; break;}
          case 4: {++id[3]; break;}
          case 5: {++id[4]; break;}
          case 6: {++id[1]; break;}
          case 7: {++id[5]; break;}
          case 8: {++id[7]; break;}
          case 13: break;
          case 14: break;
          default: {++id[6]; break;}
        }
      }
      if (p.result == 2 && !has[p.userName] && (what < 0 || p.language == what)) {
        has[p.userName] = 1;
        if (a <= I && I < b) {
          sols.push(p);
          if (flg) pattern += '|';
          else flg = true;
          pattern += '('+p.userName+')';
        }
        ++I;
      }
    });
    var str = I+'-'+solutions.length;
    if (!req.body.amount) {
      for (var i = 0; i < 8; i++)
        str += '-'+id[i];
    }
    pattern += '$';
    User.Find (0, {name: new RegExp(pattern)}, function(err, users){
      if (err) {
        console.log(err);
        return res.end();
      }
      sols.push(str);
      sols.push(users);
      res.json(sols);
    });
  });
};

exports.regCon = function(req, res) {
  var page = parseInt(req.body.page);
  if (!page) {
    var type, q;
    if (req.session.regQ) q = req.session.regQ;
    else q = {};
    if (req.params.type == 'apply') {
      q.cid = -1, type = 1;
      res.render('regform', { title: 'Register Form',
                              user: req.session.user,
                              message: req.session.msg,
                              time: (new Date()).getTime(),
                              key: 2,
                              type: type,
                              Q: q
      });
    } else {
      type = 2;
      var cid = parseInt(req.params.type);
      if (!cid)
        return res.end('Cannot GET the page.');
      Contest.watch(cid, function(err, contest){
        if (err || !contest || contest.type != 2 || !contest.password) {
          if (err) console.log(err);
          return res.end('Cannot GET the page.');
        }
        q.cid = contest.contestID;
        q.name = contest.title;
        q.startTime = contest.startTime;
        res.render('regform', { title: 'Register Form',
                                user: req.session.user,
                                message: req.session.msg,
                                time: (new Date()).getTime(),
                                key: 2,
                                type: type,
                                Q: q
        });
      });
    }
    return ;
  }

  var q = {cid: req.body.cid}, str = req.body.search;
  var q2 = {cid: req.body.cid};

  req.session.regQ = null;
  req.session.regQ = {};
  req.session.regQ.page = page;
  req.session.regQ.search = str;

  if (str) {
    q.user = q2.realname = new RegExp("^.*"+toEscape(str)+".*$", 'i');
  }

  Reg.get({$or:[q, q2]}, page, req.body.pagenum, function(err, regs, n) {
    if (err) {
      console.log(err);
      return res.end();
    }
    var flg = false, has = {}, pattern = '^';
    regs.forEach(function(p){
      if (flg) pattern += '|';
      else flg = true;
      pattern += '('+p.user+')';
    });
    pattern += '$';
    User.Find (0, {name: new RegExp(pattern)}, function(err, users){
      if (err) {
        console.log(err);
        return res.end();
      }
      regs.push(n);
      regs.push(users);
      res.json(regs);
    });
  });
};

exports.contestReg = function(req, res) {
  if (!req.session.user) {
    req.session.msg = "Please login first!";
    return res.end('1');
  }
  var cid = parseInt(req.body.cid);
  Contest.watch(cid, function(err, doc){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (getDate(new Date()) > calDate(doc.startTime, -5)) {
      req.session.msg = "Register is closed.";
      return res.end('1');
    }
    var name = '!'+req.session.user.name;
    Contest.update(cid, {$addToSet: {contestants:name}}, function(err){
      if (err) {
        req.session.msg = err;
      }
      return res.end();
    });
  });
};

exports.doRegCon = function(req, res) {
  if (!req.session.user) {
    req.session.msg = '请先登录!';
    return res.end('1');
  }
  if (req.session.user.name == 'admin') {
    req.session.msg = '管理员无需注册。';
    return res.end();
  }
  var cid = parseInt(req.body.cid), name = req.session.user.name;
  Reg.Find(cid, name, function(err, doc){
    if (doc) {
      if (doc.status == 2) {
        req.session.msg = '您已通过审核，无需修改。';
        return res.end();
      }
      doc.regTime = getDate(new Date());
      doc.number = req.body.number;
      doc.realname = req.body.realname;
      doc.sex = req.body.sex;
      doc.college = req.body.college;
      doc.grade = req.body.grade;
      doc.status = 0;
      doc.save(function(err){
        if (err) console.log(err);
        req.session.msg = '信息修改成功！请等待管理员审核。';
        res.end();
      });
    } else {
      IDs.get ('regID', function(err, id) {
        var newReg = new Reg({
          regID: id,
          cid: cid,
          user: name,
          regTime: getDate(new Date()),
          number: req.body.number,
          realname: req.body.realname,
          sex: req.body.sex,
          college: req.body.college,
          grade: req.body.grade
        });
        newReg.save(function(err) {
          if (err) {
            console.log(err);
            return res.end();
          }
          if (cid < 0) req.session.msg = '申请';
          else req.session.msg = '报名';
          req.session.msg += '成功！请等待管理员审核。';
          res.end();
        });
      });
    }
  });
};

exports.regUpdate = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  var pvl = parseInt(req.session.user.privilege);
  if (!pvl || pvl < 81) {
    req.session.msg = '你的权限不足';
    return res.end();
  }
  Reg.update(parseInt(req.body.rid), req.body.status, function(err){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (req.body.status == '2') {
      User.get(req.body.name, function(err, user) {
        if (err) {
          console.log(err);
          return res.end();
        }
        var flg = false;
        if (user.number != req.body.number)
          user.number = req.body.number, flg = true;
        if (user.realname != req.body.realname)
          user.realname = req.body.realname, flg = true;
        if (user.sex != req.body.sex)
          user.sex = req.body.sex, flg = true;
        if (user.college != req.body.college)
          user.college = req.body.college, flg = true;
        if (user.grade != req.body.grade)
          user.grade = req.body.grade, flg = true;
        if (flg) {
          user.privilege = '70';
          user.save(function(err){
            if (err) console.log(err);
            res.end();
          });
        } else res.end();
      });
    } else res.end();
  });
};

exports.regContest = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  var pvl = parseInt(req.session.user.privilege);
  if (!pvl || pvl < 81) {
    req.session.msg = '你的权限不足';
    return res.end();
  }
  var cid = parseInt(req.body.cid);
  Contest.watch(cid, function(err, doc){
    if (err) {
      console.log(err);
      req.session.msg = err;
      return res.end();
    }
    if (!doc) return res.end();
    var names = req.body.names;
    if (names) {
      Contest.update(cid, {$addToSet: {contestants: {$each:names}}}, function(err){
        if (err) {
          console.log(err);
          req.session.msg = err;
          return res.end();
        }
      });
    }
  });
  res.end();
};

exports.regContestAdd = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = 'Failed! You aren\'t admin';
    return res.end();
  }
  var name = req.body.name;
  if (!name) return res.end();
  User.get(name, function(err, user){
    if (err || !user) {
      if (err) console.log(err);
      else req.session.msg = 'The user is not exist.';
      return res.end();
    }
    Contest.update(req.body.cid, {$addToSet: {contestants:'!'+name}}, function(err){
      if (err) {
        req.session.msg = err;
      }
      return res.end();
    });
  });
};

exports.regContestDel = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = 'Failed! You aren\'t admin';
    return res.end();
  }
  var cid = parseInt(req.body.cid);
  Contest.watch(cid, function(err, doc){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (!doc) return res.end();
    var name = req.body.name;
    Contest.update(cid, {$pullAll: {contestants:['!'+name, '*'+name]}}, function(err){
      if (err) {
        req.session.msg = err;
      }
      return res.end();
    });
  });
};

exports.toStar = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = 'update Failed! You aren\'t admin';
    return res.end();
  }
  var a, b, cid = parseInt(req.body.cid);
  if (req.body.star) a = '!', b = '*';
  else a = '*', b = '!';
  a += req.body.user;
  b += req.body.user;
  Contest.update(cid, {$pull: {contestants:b}}, function(err){
    if (err) {
      req.session.msg = err;
      return res.end();
    }
    Contest.update(cid, {$addToSet: {contestants:a}}, function(err){
      if (err) {
        req.session.msg = err;
      }
      res.end();
    });
  });
};

exports.changeGrade = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = 'update Failed! You aren\'t admin';
    return res.end();
  }
  Reg.Find(req.body.cid, req.body.name, function(err, doc){
    if (err) {
      req.session.msg = err;
      return res.end();
    }
    if (!doc) {
      req.session.msg = 'The record is not exist.';
      return res.end();
    }
    doc.grade = req.body.grade;
    doc.save(function(err){
      if (err) console.log(err);
      req.session.msg = 'Information change complete.';
      res.end();
    });
  });
};