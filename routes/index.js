/*
~key~
-1    : index
 0    : user
 1    : statistic
 2    : register
 3    : problemset
 4    : status
 5    : ranklist
 6    : contest
 7    : faq
 8    : problem
 9    : onecontest
 10   : submit
 11   : sourcecode
 12   : avatar
 13   : addstudent
 14   : course
 15   : onecourse
 16   : courserank
 1000/1001: addproblem
 1002 : addcontest
 1003 : addcourse

~user.privilege~
 99 : 'Administrator-管理员'(only user.name == admin)
 82 : 'Teacher-老师'
 81 : 'Captain-队长'
 73 : 'Visitant-贵宾'
 72 : 'Expert-资深队员'
 71 : 'Specialist-普通队员'
 70 : 'Student-本校学生'
 nil: 'Normal-普通用户'

~addcontest~
 !cid     : add a new contest
 cid < 0  : clone a contest(clone a contest to a DIY Contest)
 cid > 0  : edit a contest

~contest.type~
 1 : DIY Contest (all registered user can add)
 2 : VIP Contest (only admin can add)
 3 : Exam (user.privilege >= 82(teacher) can add)

~session~
 req.session.user : current user
 req.session.cid : if current user has enter a private contest before, write down it, no need to wirte password again
*/
var crypto = require('crypto')
,   fs = require('fs')
,   csv = require('csv')
,   Iconv  = require('iconv').Iconv
,   gm = require('gm')
,   imageMagick = gm.subClass({ imageMagick : true })
,   exec = require('child_process').exec
,   IDs = require('../models/ids.js')
,   ContestRank = require('../models/contestrank.js')
,   User = require('../models/user.js')
,   Solution = require('../models/solution.js')
,   Problem = require('../models/problem.js')
,   Contest = require('../models/contest.js')
,   Course = require('../models/course.js')
,   Reg = require('../models/reg.js')
,   tCan = require('../models/can.js');

var settings = require('../settings')
,   ranklist_pageNum = settings.ranklist_pageNum
,   stats_pageNum = settings.stats_pageNum
,   contestRank_pageNum = settings.contestRank_pageNum
,   Tag = settings.T
,   ProTil = settings.P;

var data_path = settings.data_path;



var College = ['其他学院', '计算机科学与教育软件学院', '数学与信息科学学院', '土木工程学院', '物理与电子工程学院', '机械与电气工程学院'];

function nil(n) {
  return (typeof(n) == 'undefined');
}

//return status color class
function Col (n) {
  switch(n) {
    case 0:
    case 1: return 'info-text';
    case 2: return 'accept-text';
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 9:
    case 10:
    case 11:
    case 12:
    case 15: return 'wrong-text';
    default: return 'special-text';
  }
}

//return status result string
function Res (n) {
  switch(n) {
    case 0: return 'Pending...';
    case 1: return 'Running...';
    case 2: return 'Accepted';
    case 3: return 'Presentation Error';
    case 4: return 'Time Limit Exceeded';
    case 5: return 'Memory Limit Exceeded';
    case 6: return 'Wrong Answer';
    case 7: return 'Output Limit Exceeded';
    case 8: return 'Compilation Error';
    case 13: return 'Dangerous Code';
    case 14: return 'System Error';
    default: return 'Runtime Error';
  }
}

//return user color style
function UserCol (n) {
  n = parseInt(n, 10);
  if (!n) return 'black';
  switch(n) {
      case 73:
      case 99: 
      case 81: return 'red';
      case 82: return 'orange';
      case 72: return 'violet';
      case 71: return 'cyan';
      case 70: return 'green';
  }
}

//return user title
function UserTitle (n) {
  n = parseInt(n, 10);
  if (!n) return 'Normal-普通用户';
  switch(n) {
      case 99: return 'Administrator-创界者';
      case 82: return 'Teacher-老师';
      case 81: return 'Captain-队长';
      case 73: return 'Visitant-贵宾';
      case 72: return 'Expert-资深队员';
      case 71: return 'Specialist-普通队员';
      case 70: return 'Student-本校学生';
  }
}

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
  if (!str) {
    return '';
  }
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
  if (!s) return false;
  for (var i = 0; i < s.length; i++) {
    if (s[i] == name)
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

exports.updateStatus = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var id = req.body.runid;
  if (!id) {
    return res.end();
  }
  Solution.watch({runID:id}, function(err, sol){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (!sol || sol.result == 0) {
      return res.end();
    }
    var RP = function(X){
      if (X > 0) {
        sol.time = '---'; sol.memory = '---';
      }
      return res.json({result: sol.result, time: sol.time, memory: sol.memory, userName: sol.userName});
    };
    if (sol.cID == -1) {
      return RP(0);
    }
    if (req.session.user) {
      var me = req.session.user.name;
      if (me == sol.userName || me == 'admin') {
        return RP(0);
      } else {
        Contest.watch(sol.cID, function(err, contest){
          if (err) {
            console.log(err);
            return res.end();
          }
          if (!contest) {
            return res.end();
          }
          if (me == contest.userName) {
            return RP(0);
          }
          return RP(1);
        });
      }
    } else {
      return RP(1);
    }
  });
};

exports.getOverview = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();
  }
  Solution.mapReduce({
    map: function(){
      emit(this.problemID, { AC:1, all:1, result:this.result });
    },
    reduce: function(key, vals){
      val = { AC:0, all:0, result:2 };
      vals.forEach(function(p, i){
        val.all += p.all;
        if (p.result == 2) {
          val.AC += p.AC;
        }
      });
      return val;
    },
    finalize: function(key, val){
      if (val.result != 2) {
        return { AC:0, all:1 };
      }
      return { AC:val.AC, all:val.all };
    },
    query: {cID: cid},
    sort: {runID: 1}
  }, function(err, results){
    if (err) {
      console.log(err);
      res.end();
    }
    if (req.session.user) {
      Solution.aggregate([
      { $match: { userName: req.session.user.name, cID: cid } }
    , { $group: { _id: '$problemID', result: {$first: '$result'} } }
    , { $sort: { result: -1 } }
      ], function(err, sols){
        if (err) {
          console.log(err);
          res.end();
        }
        res.json([results, sols]);
      });
    } else {
      res.json([results, null]);
    }
  });
};

exports.getStatus = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();
  }
  Contest.watch(cid, function(err, contest){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (!contest) {
      return res.end();
    }
    var Q = {cID: cid}, page, name, pid, result, lang;

    page = parseInt(req.body.page, 10);
    if (!page) {
      page = 1;
    } else if (page < 0) {
      return res.end();
    }

    name = req.body.name;
    if (name) Q.userName = new RegExp("^.*"+toEscape(name)+".*$", 'i');

    pid = parseInt(req.body.pid, 10);
    if (pid) Q.problemID = pid;

    result = parseInt(req.body.result, 10);
    if (result >= 0) {
      if (result > 8 && result < 13) {
        Q.result = {$gt:8, $lt:13};
      } else {
        Q.result = result;
      }
    }

    lang = parseInt(req.body.lang, 10);
    if (lang) Q.language = lang;

    Solution.get(Q, page, function(err, solutions, n) {
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      if (n < 0) {
        return res.end();
      }
      var sols = new Array(), names = new Array(), has = {};
      if (solutions) {
        solutions.forEach(function(p, i){
          var T = '', M = '', L = '';
          if (req.session.user && (req.session.user.name == p.userName ||
              req.session.user.name == contest.userName)) {
            T = p.time; M = p.memory; L = p.length;
          }
          sols.push({
            runID     : p.runID,
            userName  : p.userName,
            problemID : p.problemID,
            result    : p.result,
            time      : T,
            memory    : M,
            language  : p.language,
            length    : L,
            inDate    : p.inDate
          });
          if (!has[p.userName]) {
            has[p.userName] = true;
            names.push(p.userName);
          }
        });
      }
      User.find({name: {$in: names}}, function(err, users){
        if (err) {
          console.log(err);
          return res.end();
        }
        var pvl = {};
        if (users) {
          users.forEach(function(p){
            pvl[p.name] = p.privilege;
          });
        }
        return res.json([sols, n, pvl]);
      });
    });
  });
};

exports.getRanklist = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var cid = parseInt(req.body.cid, 10);
  if (!cid || cid < 0) {
    return res.end();
  }
  var page = parseInt(req.body.page, 10);
  if (!page) {
    page = 1;
  } else if (page < 0) {
    return res.end();
  }
  var now = (new Date()).getTime();
  Contest.findOneAndUpdate({
    contestID   : cid,
    updateTime  : { $lt: now-60000 }
  }, {
    $set: { updateTime: now }
  }, {
    new : false
  }, function(err, contest){
    if (err) {
      console.log(err);
      return res.end();
    }
    var RP = function(con){
      ContestRank.get({_id: new RegExp('^'+cid+'-.*$')}, page, function(err, users, n){
        if (err) {
          console.log(err);
          return res.end();
        }
        if (n < 0) {
          return res.end();
        }
        var names = new Array();
        if (users) {
          var has = {};
          users.forEach(function(p, i){
            p._id = p._id.split('-')[1];
            has[p._id] = true;
            names.push(p._id);
          });
        }
        User.find({name: {$in:names}}, function(err, U){
          if (err) {
            console.log(err);
            req.session.msg = '系统错误！';
            return res.redirect('/');
          }
          var pvl = {}, I = {};
          if (U) {
            U.forEach(function(p){
              pvl[p.name] = p.privilege;
              if (con.type == 3 || (con.type == 2 && con.password)) {
                I[p.name] = { gde: p.grade, name: p.realname };
              } else {
                I[p.name] = p.nick;
              }
            });
          }
          return res.json([users, pvl, I, n]);
        });
      });
    };
    if (!contest) {
      Contest.watch(cid, function(err, con){
        if (err) {
          console.log(err);
          return res.end();
        }
        if (!con) {
          return res.end();
        }
        return RP(con);
      });
    } else {
      Solution.mapReduce({
        out: { merge: 'ranks' },
        map: function(){
          return emit(this.cID+'-'+this.userName, {
            solved: 0,
            pid: this.problemID,
            result: this.result,
            status: {},
            inDate: parseInt((new Date(this.inDate)).getTime()/60000, 10)
          });
        },
        reduce: function(key, vals){
          var val = { solved: 0, penalty: 0, pid: null, result: null, status: {}, inDate: null };
          vals.forEach(function(p){
            if (p.pid) {
              if (p.result == 2) {
                if (!val.status[p.pid]) {
                  ++val.solved;
                  val.penalty += p.inDate;
                  val.status[p.pid] = { wa: 0, inDate: p.inDate };
                } else if (val.status[p.pid].wa < 0) {
                  ++val.solved;
                  val.status[p.pid].wa = -val.status[p.pid].wa;
                  val.penalty += val.status[p.pid].wa*20 + p.inDate;
                  val.status[p.pid].inDate = p.inDate;
                }
              } else {
                if (!val.status[p.pid]) {
                  val.status[p.pid] = { wa: -1 };
                } else if (val.status[p.pid].wa < 0) {
                  --val.status[p.pid].wa;
                }
              }
            } else {
              for (var i in p.status) {
                var o = p.status[i];
                if (!val.status[i]) {
                  if (o.wa >= 0) {
                    val.solved++;
                    val.penalty += o.wa*20 + o.inDate;
                  }
                  val.status[i] = o;
                } else if (val.status[i].wa < 0) {
                  if (o.wa >= 0) {
                    val.solved++;
                    val.status[i].wa = o.wa - val.status[i].wa;
                    val.penalty += val.status[i].wa*20 + o.inDate;
                  } else {
                    val.status[i].wa += o.wa;
                  }
                }
              }
            }
          });
          return val;
        },
        finalize: function(key, val){
          if (val.pid) {
            var tp = { solved:0, penalty:0, status:{} };
            if (val.result == 2) {
              tp.solved = 1;
              tp.penalty = val.inDate;
              tp.status[val.pid] = { wa: 0, inDate: val.inDate };
              return tp;
            } else {
              tp.status[val.pid] = { wa: -1 };
              return tp;
            }
          }
          return { solved: val.solved, penalty: val.penalty, status: val.status };
        },
        query: { $and: [
          {cID: cid},
          {$nor: [{userName:'admin'}]},
          {inDate: {$gte: contest.startTime+':00', $lte: calDate(contest.startTime, contest.len)}},
        ] },
        sort: {runID: 1}
      }, function(err){
        if (err) {
          console.log(err);
          return res.end();
        }
        return RP(contest);
      });
    }
  });
};

exports.getCE = function(req, res) {
  res.header('Content-Type', 'text/plain');
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
  res.header('Content-Type', 'text/plain');
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
  User.watch(req.body.name, function(err, user){
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
    user.college = req.body.college;
    user.save(function(err){
      if (err) {
        console.log(err);
        return res.end();
      }
      req.session.msg = 'The Information has been changed successfully!';
      return res.end();
    });
  });
};

exports.changeAddprob = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = 'Failed! You have no permission to do that!';
    return res.end();
  }
  User.watch(req.body.name, function(err, user){
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
      req.session.msg = 'The Information has been changed successfully!';
      return res.end();
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

  User.watch(req.body.name, function(err, user){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.end('F');
    }
    if (!user) {
      return res.end('F');
    }
    if (oldpassword != user.password)
      return res.end('T');

    if (req.body.password) {
      var tmd = crypto.createHash('md5');
      user.password = tmd.update(req.body.password).digest('base64');
    }
    var H = {
      nick    : req.body.nick,
      school  : req.body.school,
      email   : req.body.email,
      signature : req.body.signature
    };
    if (req.body.password) {
      var Md5 = crypto.createHash('md5');
      H.password = Md5.update(req.body.password).digest('base64');
    }
    User.update({name: req.body.name}, H, false, function(err){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
      } else req.session.msg = 'Your Information has been updated successfully!';
      return res.end('F');
    });
  });
};

exports.getProblem = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (req.body.curl) {
    if (!req.session.oneQ) req.session.oneQ = {};
    req.session.oneQ[req.body.cid] = req.body.curl;
  }
  var pid = parseInt(req.body.pid, 10);
  if (!pid) return res.end();
  Problem.watch(req.body.pid, function(err, problem){
    if (err || !problem)
      return res.end();
    if (req.body.all)
      return res.json(problem);
    if (problem.hide == true &&
      (!req.session.user || (req.session.user.name != 'admin' && req.session.user.name != problem.manager)))
      return res.end();
    return res.end(problem.title);
  });
};

exports.editTag = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user)
    return res.end();
  var pid = parseInt(req.body.pid)
  ,   tag = parseInt(req.body.tag);
  if (!pid || !tag)
    return res.end();
  var name = req.session.user.name
  ,   RP = function(){
    var Q;
    if (req.body.add) Q = {$addToSet: {tags:tag}};
    else Q = {$pull: {tags:tag}};
    Problem.update(req.body.pid, Q, function(err, problem){
      if (err) {
        console.log(err);
        return res.end();
      }
      if (req.body.add) req.session.msg = 'Tag has been added to the problem successfully!';
      else req.session.msg = 'Tag has been removed from the problem successfully!';
      return res.end();
    });
  };
  if (name == 'admin') {
    return RP();
  }
  Problem.watch(pid, function(err, problem){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (!problem) {
      return res.end();
    }
    if (name == problem.manager) {
      return RP();
    }
    Solution.watch({problemID:pid, userName:name, result:2}, function(err, solution) {
      if (err) {
        console.log(err);
        return res.end();
      }
      if (!solution) {
        return res.end();
      }
      return RP();
    });
  });
};

exports.reg = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user || req.session.user.name != 'admin') {
    return res.end('4');
  }
  var name = req.body.name
  ,   realname = req.body.realname
  ,   sex = req.body.sex
  ,   gde = req.body.gde
  ,   college = req.body.college;
  if (!name || !realname || !sex || !gde || !college) {
    return res.end('4');
  }
  User.watch(name, function(err, user){
    if (err) {
      console.log(err);
      return res.end('3');
    }
    if (user) {
      user.number = name;
      user.realname = realname;
      user.sex = sex;
      user.grade = gde;
      user.college = college;
      user.save(function(err){
        if (err) {
          console.log(err);
          return res.end('3');
        }
        return res.end('2');
      });
    } else {
      var md5 = crypto.createHash('md5')
      ,   psw = md5.update('123456').digest('base64');
      (new User({
        name      : name,
        password  : psw,
        regTime   : getDate(new Date()),
        nick      : realname,
        number    : name,
        realname  : realname,
        sex       : sex,
        grade     : gde,
        college   : college,
        privilege : '70'
      })).save(function(err){
        if (err) {
          console.log(err);
          return res.end('3');
        }
        return res.end('1');
      });
    }
  });
};

exports.doReg = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var name = req.body.username
  ,   nick = req.body.nick
  ,   password = req.body.password
  ,   vcode = req.body.vcode
  ,   school = req.body.school
  ,   email = req.body.email
  ,   sig = clearHtml(req.body.signature);
  if (!name || !password || !nick || !vcode) {
    return res.end();   //not allow
  }
  if (!school) school = '';
  if (!email) email = '';

  if (vcode != req.session.verifycode) {
    return res.end('1');
  }

  User.watch(name, function(err, user){
    if (err) {
      console.log(err);
      return res.end('3');
    }
    if (user) {
      return res.end('2');
    }
    var md5 = crypto.createHash('md5')
    ,   psw = md5.update(password).digest('base64');
    (new User({
      name      : name,
      password  : psw,
      regTime   : getDate(new Date()),
      nick      : nick,
      school    : school,
      email     : email,
      signature : sig
    })).save(function(err, user) {
      if (err) {
        console.log(err);
        return res.end('3');
      }
      req.session.user = user;
      req.session.msg = 'Welcome, '+name+'. :)';
      return res.end();
    });
  });
};

exports.doLogin = function(req, res) {
  res.header('Content-Type', 'text/plain');
  //生成密码散列值
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('base64');
  User.watch(req.body.username, function(err, user) {
    if (!user)
      return res.end('1');
    if (user.password != password)
      return res.end('2');
    if (!user.addprob) user.addprob = 0;
    else user.addprob = 1;
    req.session.user = user;
    req.session.msg = 'Welcome, '+user.name+'. :)';
    return res.end('3');
  });
};

exports.loginContest = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var cid = parseInt(req.body.cid, 10);
  if(!cid) {
    return res.end();
  }
  Contest.watch(cid, function(err, contest){
    if (err) {
      console.log(err);
      return res.end();
    }

    var md5 = crypto.createHash('md5');
    psw = md5.update(req.body.psw).digest('base64');
    if (psw == contest.password) {
      if (!req.session.cid) req.session.cid = {};
      req.session.cid[req.body.cid] = true;
      return res.end('1');
    }
    return res.end();
  });
};

exports.createVerifycode = function(req, res) {
  res.header('Content-Type', 'text/plain');
  tCan.Can (function(vcode, html){
    req.session.verifycode = vcode;
    return res.end(html);
  });
};

exports.upload = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var path = req.files.info.path;
  var sz = req.files.info.size;
  if (sz < 50 || sz > 65535) {
    fs.unlink(path, function() {
      if (sz < 50) {
        return res.end('1');
      } else {
        return res.end('2');
      }
    });
  } else {
    fs.readFile(path, 'utf8', function(err, data){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.end('3');
      }
      fs.unlink(path, function() {
        if (!req.body.lang) {
          console.log('lang');
          return res.end();   //language empty is not allow!!!
        }
        var pid = parseInt(req.query.pid, 10);
        if (!pid) {
          console.log('pid');
          return res.end();   //pid empty is not allow!!!
        }
        Problem.watch(pid, function(err, problem){
          if (err) {
            console.log(err);
            req.session.msg = '系统错误！';
            return res.end('3');
          }
          if (!problem) {
            return res.end();    //problem empty is not allow!!!
          }
          if (!req.session.user) {
            req.session.msg = 'Failed! Please login first!';
            return res.redirect('/problem?pid='+pid);
          }
          IDs.get ('runID', function(err, id){
            if (err) {
              console.log(err);
              req.session.msg = '系统错误！';
              return res.end('3');
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
                req.session.msg = '系统错误！';
                return res.end('3');
              }
              Problem.update(pid, {$inc: {submit: 1}}, function(err){
                req.session.msg = 'The code for problem '+pid+' has been submited successfully!';
                return res.end();
              });
            });
          });
        });
      });
    });
  }
};

exports.rejudge = function(req, res) {
  res.header('Content-Type', 'text/plain');
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
      Solution.distinct('userName', {problemID:pid, result:2}, function(err, users){
        if (err) {
          console.log(err);
          return res.end();
        }
        User.update({'name': {$in: users}}, {$inc: {solved:-1}}, true, function(err){
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

//重新统计用户提交数和AC数
function recalAfterClear() {
  User.update({}, {$set: {submit:0, solved:0}}, true, function(err){
    if (err) {
      console.log(err);
    }
    User.find({}, function(err, users){
      users.forEach(function(user){
        Solution.count({userName:user.name}, function(err, submitN){
          if (err) {
            console.log(err);
          }
          Solution.distinct('problemID', {userName:user.name, result:2}, function(err, docs){
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

exports.index = function(req, res){
  //resetPassword();
  //IDs.Init();
  //recalAfterClear();
  //ContestRank.del();
  res.render('index', { title: 'Gzhu Online Judge',
                        user: req.session.user,
                        message: req.session.msg,
                        time: (new Date()).getTime(),
                        key: -1
  });
};

exports.user = function(req, res) {
  var name = req.params.name;
  if (!name) {
    return res.end('the user is not exist.');
  }
  User.watch(name, function(err, user){
    if (err) {
      req.session.msg = err;
      return res.redirect('/');
    }
    if (!user) {
      return res.end('the user is not exist.');
    }
    Solution.find({userName:name}, function(err, solutions) {
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
      User.count({$and: [{
        $nor: [{name: 'admin'}]
      },{
        $or:[
          { solved: {$gt: user.solved} },
          { $and:[ {solved: user.solved}, {submit: {$lt: user.submit}} ] },
          { $and:[ {solved: user.solved}, {submit: user.submit}, {name: {$lt: user.name}} ] }
        ]
      }]},
        function(err, rank){
        if (err) {
          req.session.msg = err;
          return res.redirect('/');
        }
        user.rank = rank + 1;
        if (!user.addprob) user.addprob = 0;
        else user.addprob = 1;
        res.render('user', {title: 'User',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            key: 0,
                            u: user,
                            A: A.sort(),
                            B: B.sort(),
                            C: College
        });
      });
    });
  });
};

exports.avatar = function(req, res) {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('avatar', {title: 'Avatar Setting',
                        user: req.session.user,
                        message: req.session.msg,
                        time: (new Date()).getTime(),
                        key: 12
  });
};

exports.avatarUpload = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var path = req.files.img.path;  //获取用户上传过来的文件的当前路径
  var sz = req.files.img.size;
  var tmp = req.files.img.type.split('/');
  var imgType = tmp[1];
  if (sz > 2*1024*1024) {
    fs.unlink(path, function(){  //fs.unlink 删除用户上传的文件
      return res.end('1');
    });
  } else if (tmp[0] != 'image') {
    fs.unlink(path, function(){
      return res.end('2');
    });
  } else {
    if (!req.session.user) {
      fs.unlink(path, function(){
        return res.end();
      });
    }
    var pre = 'public/img/avatar/' + req.session.user.name;
    exec('rm -r '+pre, function(){
      fs.mkdir(pre, function(err){
        if (err) {
          console.log(err);
          return res.end('3');
        }
        var originImg = imageMagick(path);
        originImg.resize(250, 250, '!') //加('!')强行把图片缩放成对应尺寸250*250！
        .autoOrient()
        .write(pre+'/1.'+imgType, function(err){
          if (err) {
            console.log(err);
            return res.end('3');
          }
          originImg.resize(150, 150, '!')
          .autoOrient()
          .write(pre+'/2.'+imgType, function(err){
            if (err) {
              console.log(err);
              return res.end('3');
            }
            originImg.resize(100, 100, '!')
            .autoOrient()
            .write(pre+'/3.'+imgType, function(err){
              if (err) {
                console.log(err);
                return res.end('3');
              }
              originImg.resize(50, 50, '!')
              .autoOrient()
              .write(pre+'/4.'+imgType, function(err){
                if (err) {
                  console.log(err);
                  return res.end('3');
                }
                if (imgType != req.session.user.imgType) {
                  User.update({name:req.session.user.name}, {imgType:imgType}, false, function(err){
                    fs.unlink(path, function() {
                      req.session.user.imgType = imgType;
                      req.session.msg = '头像修改成功！';
                      return res.end();
                    });
                  });
                } else {
                  fs.unlink(path, function() {
                    req.session.msg = '头像修改成功！';
                    return res.end();
                  });
                }
              });
            });
          });
        });
      })
    });
  }
};

exports.csvUpload = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var path = req.files.csv.path;
  if (!req.session.user || req.session.user.name != 'admin') {
    fs.unlink(path, function(){
      return res.end();
    });
  } else {
    fs.readFile(path, function(err, data){
      if (err) {
        console.log(err);
        return res.end('3');
      }
      var str = data.toString();
      if(str.indexOf('�') != -1){
        var gbk_to_utf8 = new Iconv('GBK', 'UTF8');
        str = gbk_to_utf8.convert(data).toString();
      }
      var results;
      csv()
      .from(str, {delimiter: ',', escape: '"'})
      .to.array(function(data, count){
        fs.unlink(path, function(){
          return res.json(data);
        });
      })
      .on('error', function(err){
        console.log(err.message);
      });
    });
  }
};

exports.addstudent = function(req, res) {
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.redirect('/');
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = '抱歉，您的权限不足！';
    return res.redirect('/');
  }
  res.render('addstudent', { title: 'addstudent',
                             user: req.session.user,
                             message: req.session.msg,
                             time: (new Date()).getTime(),
                             key: 13,
                             C: College
  });
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
  var tk = 1000, pid = parseInt(req.query.pID)
  ,   RP = function(P, F, I) {
    res.render('addproblem', { title: 'addproblem',
                               user: req.session.user,
                               message: req.session.msg,
                               time: (new Date()).getTime(),
                               problem: P,
                               key: tk,
                               files: F,
                               imgs: I
    });
  }
  if (!pid) {
    return RP(null, null, null);
  } else {
    Problem.watch(pid, function(err, problem){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      if (!problem) {
        return RP(null, null, null);
      }
      if (problem.hide == true && req.session.user.name != 'admin' && req.session.user.name != problem.manager) {
        req.session.msg = 'You have no permission to edit this hidden problem!';
        return res.redirect('/');
      }
      ++tk;
      fs.readdir('public/img/prob/'+pid, function(err, imgs){
        if (!imgs) imgs = [];
        fs.readdir(data_path+pid, function(err, files){
          if (!files) files = [];
          return RP(problem, files, imgs);
        });
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
  var pid = parseInt(req.body.pid);
  if (pid) {
    var title = req.body.Title;
    if (!title) title = 'NULL';
    var spj = parseInt(req.body.isSpj);
    if (!spj) spj = 0;
    var tle = parseInt(req.body.Timelimit);
    if (!tle) tle = 1000;
    var mle = parseInt(req.body.Memorylimit);
    if (!mle) mle = 64000;
    var hide = false;
    if (req.body.hide == '1') hide = true;
    else hide = false;
    var tc = false;
    if (req.body.TC == '1') tc = true;
    else tc = false;
    Problem.update(pid, {$set: {
      title: title,
      description: req.body.Description,
      input: req.body.Input,
      output: req.body.Output,
      sampleInput: req.body.sInput,
      sampleOutput: req.body.sOutput,
      hint: req.body.Hint,
      source: req.body.Source,
      spj: spj,
      timeLimit: tle,
      memoryLimit: mle,
      hide: hide,
      TC: tc
    }}, function(err) {
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      req.session.msg = 'Problem '+pid+' has been updated successfully!';
      return res.redirect('/problem?pid='+pid);
    });
  } else {
    IDs.get ('problemID', function(err, id) {
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      var manager = '';
      if (req.session.user.name != 'admin')
        manager = req.session.user.name;
      var newProblem = new Problem({
        problemID: id,
        manager: manager
      });
      newProblem.save(function(err){
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        fs.mkdir(data_path+id, function(err){
          if (err) {
            console.log('fs.mkdir err: ' + err);
            return res.redirect('/');
          }
          req.session.msg = 'Problem '+id+' has been created successfully!';
          return res.redirect('/addproblem?pID='+id);
        });
      });
    });
  }
};

exports.imgUpload = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var path = req.files.info.path;
  var sz = req.files.info.size;
  if (sz > 2*1024*1024) {
    fs.unlink(path, function() {
      return res.end('1');
    });
  } else if (req.files.info.type.split('/')[0] != 'image') {
    fs.unlink(path, function() {
      return res.end('2');
    });
  } else {
    fs.readFile(path, function(err, data){
      if (err) {
        console.log(err);
        return res.end('3');
      }
      fs.unlink(path, function() {
        if (!req.session.user) {
          return res.end();   //not allow
        }
        var pid = parseInt(req.query.pid, 10);
        if (!pid) {
          return res.end();   //not allow
        }
        User.watch(req.session.user.name, function(err, user) {
          if (err) {
            console.log(err);
            return res.end('3');
          }
          if (!user || !user.addprob) {
            return res.end(); //not allow
          }
          var pre = 'public/img/prob/'+pid;
          fs.mkdir(pre, function(err){
            fs.writeFile(pre+'/'+req.files.info.name, data, function(err){
              if (err) {
                console.log(err);
                return res.end('3');
              }
              return res.end();
            });
          });
        });
      });
    });
  }
};

exports.dataUpload = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var pid = parseInt(req.query.pid);
  if (!pid) {
    return res.end();
  }
  var file = req.files.data
  ,   path = file.path
  ,   fname = file.name
  ,   sz = file.size;
  if (sz > 10*1024*1024) {
    return res.end('2');
  }
  fs.readFile(path, function(err, data){
    if (err) {
      console.log(err);
      return res.end('3');
    }
    fs.unlink(path, function() {
      if (!req.session.user) {
        return res.end();
      }
      User.watch(req.session.user.name, function(err, user){
        if (err) {
          console.log(err);
          return res.end('3');
        }
        if (!user || !user.addprob) {
          return res.end();
        }
        fs.writeFile(data_path+pid+'/'+fname, data, function(err){
          if (err) {
            console.log(err);
            return res.end('3');
          }
          return res.end();
        });
      });
    });
  });
};

exports.delData = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    return res.end();
  }
  var pid = parseInt(req.body.pid, 10);
  if (!pid) {
    return res.end();
  }
  var fname = req.body.fname;
  if (!fname) {
    return res.end();
  }
  User.watch(req.session.user.name, function(err, user){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (!user || !user.addprob) {
      return res.end();
    }
    fs.unlink(data_path+pid+'/'+fname, function(){
      return res.end();
    });
  });
};

exports.delImg = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    return res.end();
  }
  var pid = parseInt(req.body.pid, 10);
  if (!pid) {
    return res.end();
  }
  var fname = req.body.fname;
  if (!fname) {
    return res.end();
  }
  User.watch(req.session.user.name, function(err, user){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (!user || !user.addprob) {
      return res.end();
    }
    fs.unlink('public/img/prob/'+pid+'/'+fname, function(){
      return res.end();
    });
  });
};

exports.logout = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user)
    return res.end();
  req.session.msg = 'Goodbye, '+req.session.user.name+'. Looking forward to seeing you at GzhuOnlineJudge.';
  req.session.user = null;
  req.session.cid = null;
  return res.end();
};

exports.problem = function(req, res) {
  var pid = parseInt(req.query.pid, 10);
  if (!pid) {
    res.render('problem', {title: 'Problem',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            key: -1,
                            problem: null
    });
  } else {
    var name = '', cid = parseInt(req.query.cid, 10);
    if (req.session.user) name = req.session.user.name;
    Solution.watch({problemID:pid, userName:name, result:2}, function(err, solution) {
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      var pvl = 0;
      if (solution) pvl = 1;
      Problem.watch(pid, function(err, problem) {
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        if (problem) {
          if (pvl == 0 && (name == 'admin' || problem.manager == name)) {
            pvl = 1;
          }
          if (problem.hide == true && (!req.session.user ||
            (req.session.user.name != 'admin' && req.session.user.name != problem.manager))) {
              problem = null;
          }
        }
        res.render('problem', { title: 'Problem '+pid,
                                user: req.session.user,
                                message: req.session.msg,
                                time: (new Date()).getTime(),
                                key: 8,
                                problem: problem,
                                pvl: pvl,
                                Tag: Tag,
                                PT: ProTil,
                                cid: cid
        });
      });
    });
  }
};

exports.problemset = function(req, res) {
  var page = parseInt(req.query.page, 10);
  if (!page) {
    page = 1;
  } else if (page < 0) {
    return res.redirect('/problemset');
  }

  var q1 = {}, q2 = {}, q3 = {}, Q, search = req.query.search;

  if (search) {
    var pattern = new RegExp("^.*"+toEscape(search)+".*$", 'i'), tag = new Array();
    for (i = 0; i < Tag.length; i++) {
      if (pattern.test(Tag[i])) {
        tag.push(i);
      }
    }
    q1.title = pattern;
    q2.tags = {$in: tag};
    q3.source = pattern;
  }

  if (!req.session.user) {
    Q = {$and: [ {$or:[q1, q2, q3]}, {hide:false} ]};
  } else if (req.session.user.name != 'admin') {
    Q = {$and: [ {$or:[q1, q2, q3]}, {$or:[{hide:false}, {manager:req.session.user.name}]} ]};
  } else Q = {$or:[q1, q2, q3]};

  Problem.get(Q, page, function(err, problems, n) {
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (n < 0) {
      return res.redirect('/problemset');
    }
    var RP = function(R){
      res.render('problemset', {title: 'ProblemSet',
                                user: req.session.user,
                                message: req.session.msg,
                                time: (new Date()).getTime(),
                                key: 3,
                                n: n,
                                problems: problems,
                                page: page,
                                search: search,
                                Tag: Tag,
                                Pt: ProTil,
                                R: R

      });
    };
    if (req.session.user && problems && problems.length > 0) {
      var pids = new Array(), R = {};
      problems.forEach(function(p){
        pids.push(p.problemID);
      });
      Solution.find({
        problemID: {$in: pids},
        userName: req.session.user.name
      }, function(err, sols){
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        if (sols) {
          sols.forEach(function(s){
            if (s.result != 2 && !R[s.problemID]) {
              R[s.problemID] = 1;
            } else if (s.result == 2 && R[s.problemID] != 2) {
              R[s.problemID] = 2;
            }
          });
          return RP(R);
        }
      });
    } else {
      return RP({});
    }
  });
};

exports.status = function(req, res) {
  var Q = {}, page, name, pid, result, lang;

  page = parseInt(req.query.page, 10);
  if (!page) {
    page = 1;
  } else if (page < 0) {
    return res.redirect('/status');
  }

  name = req.query.name;
  if (name) Q.userName = new RegExp("^.*"+toEscape(name)+".*$", 'i');

  pid = parseInt(req.query.pid, 10);
  if (pid) Q.problemID = pid;

  result = parseInt(req.query.result, 10);
  if (result >= 0) {
    if (result > 8 && result < 13) {
      Q.result = {$gt:8, $lt:13};
    } else {
      Q.result = result;
    }
  }

  lang = parseInt(req.query.lang, 10);
  if (lang) Q.language = lang;

  Solution.get(Q, page, function(err, solutions, n) {
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (n < 0) {
      return res.redirect('/status');
    }
    var flg = false, has = {}
    ,   names = new Array()
    ,   R = new Array(), C = new Array();
    if (solutions) {
      solutions.forEach(function(p, i){
        R.push(Res(p.result));
        C.push(Col(p.result));
        if (!has[p.userName]) {
          has[p.userName] = true;
          names.push(p.userName);
        }
      });
    }
    User.find({name: {$in:names}}, function(err, users){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      var UC = {}, UT = {};
      if (users) {
        users.forEach(function(p){
          UC[p.name] = UserCol(p.privilege);
          UT[p.name] = UserTitle(p.privilege);
        });
      }
      res.render('status', {title: 'Status',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            key: 4,
                            n: n,
                            solutions: solutions,
                            name: name,
                            pid: pid,
                            result: result,
                            lang: lang,
                            Res: Res,
                            Col: Col,
                            R: R,
                            C: C,
                            UC: UC,
                            UT: UT,
                            page: page
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
    return res.redirect('/contest/'+type);
  }
  var RP = function(C, clone, type) {
    res.render('addcontest', {title: 'AddContest',
                              user: req.session.user,
                              message: req.session.msg,
                              time: (new Date()).getTime(),
                              contest: C,
                              key: 1002,
                              date: getDate(new Date()).split(' ')[0],
                              clone: clone,
                              type: type
    });
  };
  tcid = parseInt(req.query.cID);
  if (!tcid) {
    if (type == 2 && req.session.user.name != 'admin') {
      req.session.msg = 'You have no permission to add VIP Contest!';
      return res.redirect('/contest/2');
    }
    if (type == 3 && parseInt(req.session.user.privilege, 10) < 82) {
      req.session.msg = 'You have no permission to add Exam!';
      return res.redirect('/contest/3');
    }
    return RP(null, 0, type);
  } else {
    var clone = 0;
    if (tcid < 0) {
      clone = 1;
      tcid = -tcid;
    }
    Contest.watch (tcid, function(err, contest){
      if (err) {
        req.session.msg = '系统错误！';
        return res.redirect('/contest/'+type);
      }
      if (contest && clone == 0 && req.session.user.name != contest.userName) {
        req.session.msg = 'You are not the manager of this contest!';
        return res.redirect('/onecontest/'+tcid);
      }
      if (clone == 1 && (!req.session.user || req.session.user.name != contest.userName)) {
        if ((contest.type != 2 && contest.password) ||
          getDate(new Date()) <= calDate(contest.startTime, contest.len)) {
            req.session.msg = 'Error! Illegal operation!';
          return res.redirect('/contest/'+type);
        }
      }
      return RP(contest, clone, null);
    });
  }
};

exports.doAddcontest = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var type = parseInt(req.body.type);
  if (!req.session.user) {
    req.session.msg = 'Failed! Please login first!';
    return res.end();
  }
  if (type == 2 && req.session.user.name != 'admin') {
    req.session.msg = 'Failed! You have no permission to add VIP Contest!';
    return res.end();
  }
  if (type == 3 && parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = 'Failed! You have no permission to add Exam!';
    return res.end();
  }
  var password = ''
  ,   ctitle = req.body.ctitle
  ,   cdate = req.body.cdate
  ,   chour = deal(req.body.chour)
  ,   cmin = deal(req.body.cminute)
  ,   cDay = parseInt(req.body.cDay, 10)
  ,   cHour = parseInt(req.body.cHour, 10)
  ,   cMin = parseInt(req.body.cMinute, 10)
  ,   desc = req.body.Description
  ,   anc = req.body.Announcement;

  if (nil(ctitle) || nil(cdate) || nil(chour) ||
      nil(cmin) || nil(cDay) || nil(cHour) || nil(cMin)) {
    return res.end();
  }
  if (nil(desc)) {
    desc = '';
  }
  if (nil(anc)) {
    anc = '';
  }

  if (type == 2) password = req.body.cpassword;
  else if (req.body.cpassword) {
    var md5 = crypto.createHash('md5');
    password = md5.update(req.body.cpassword).digest('base64');
  }
  if (!password) {
    password = '';
  }

  var ary = new Array();
  if (req.body.ary && req.body.ary.length) {
    req.body.ary.forEach(function(p){
      ary.push(p);
    });
  }

  var newContest = new Contest({
    title: ctitle,
    startTime: cdate+' '+chour+':'+cmin,
    len: cDay*1440+cHour*60+cMin,
    description: desc,
    msg: anc,
    password: password
  });
  var cid = parseInt(req.body.cid);
  if (cid >= 1000) {
    newContest.contestID = cid;
    Contest.watch(cid, function(err, doc) {
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      if (!doc) {
        return res.end();
      }
      if (req.session.user.name != doc.userName) {
        req.session.msg = 'Update Failed! You are not the manager!';
        return res.end();
      }
      doc.title = newContest.title;
      var flg = false;
      if (doc.startTime != newContest.startTime) {
        doc.startTime = newContest.startTime;
        flg = true;
      }
      if (doc.len != newContest.len) {
        doc.len = newContest.len;
        flg = true;
      }
      if (flg) doc.updateTime = 0;
      doc.description = newContest.description;
      doc.msg = newContest.msg;
      doc.probs =  ary;
      doc.password = newContest.password;
      doc.save(function(err){
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
          return res.end();
        }
        var cstr = 'Contest';
        if (type == 3) cstr = 'Exam';
        req.session.msg = 'Your '+cstr+' has been updated successfully!';
        var tp = cid.toString();
        if (!flg) {
          return res.end(tp);
        }
        ContestRank.remove({_id: new RegExp('^'+cid+'-.*$')}, function(err){
          if (err) {
            console.log(err);
            req.session.msg = '系统错误！';
            return res.end();
          }
          return res.end(tp);
        });
      });
    });
  } else {
    IDs.get ('contestID', function(err, id) {
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      newContest.contestID = id;
      newContest.userName = req.session.user.name;
      newContest.probs = ary;
      newContest.type = type;
      newContest.save(function(err) {
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
          return res.end();
        }
        var cstr = 'Contest';
        if (type == 3) cstr = 'Exam';
        req.session.msg = 'Your '+cstr+' has been added successfully!';
        return res.end(id.toString());
      });
    });
  }
};

exports.onecontest = function(req, res) {
  var cid = parseInt(req.params.cid, 10);
  if (!cid) {
    return res.redirect('/contest');
  }
  Contest.watch(cid, function(err, contest) {
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (contest) {
      if (contest.type == 3) {
        if (!req.session.user) {
          req.session.msg = 'Please login first!';
          return res.redirect('/contest/3');
        }
        if (!req.session.user.privilege) {
          req.session.msg = '你的权限不足，无法进入！';
          return res.redirect('/contest/3');
        }
      }
      if (contest.type != 2) {
        if (contest.password) {
          if (!req.session.user || req.session.user.name != contest.userName) {
            if (!req.session.cid || !req.session.cid[cid]) {
              req.session.msg = 'you should login the contest '+cid+' first!';
              return res.redirect('/contest/'+contest.type);
            }
          }
        }
      }
      var isContestant = false;
      if (contest.type != 2 ||
        (req.session.user &&
          (req.session.user.name == contest.userName ||
          IsRegCon(contest.contestants, req.session.user.name)))) {
        isContestant = true;
      }
    }
    res.render('onecontest', {title: 'OneContest',
                              user: req.session.user,
                              message: req.session.msg,
                              time: (new Date()).getTime(),
                              key: 9,
                              contest: contest,
                              getDate: getDate,
                              isContestant: isContestant,
                              pageNum: contestRank_pageNum
    });
  });
};

exports.contestDelete = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    return res.end();
  }
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();
  }
  var name = req.session.user.name;
  if (!name) {
    return res.end();
  }
  Solution.watch({cID: cid}, function(err, sol){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (sol) {
      req.session.msg = 'Can\'t delete the contest, because there are some submits in this contest!';
      return res.end();
    }
    Contest.dele({contestID: cid, userName: name}, function(err){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      req.session.msg = 'Contest '+cid+' has been deleted successfully!';
      return res.end();
    });
  });
};

exports.contest = function(req, res) {
  var type = parseInt(req.params.type, 10);
  if (!type || type < 0 || type > 3) {
    return res.redirect('/');
  }
  if (!req.query.page) {
    page = 1;
  } else {
    page = parseInt(req.query.page, 10);
  }
  if (!page || page < 0) {
    return res.redirect('/contest/'+type);
  }
  
  var q1 = {type: type}, q2 = {type: type}, search = req.query.search;

  if (search) {
    q1.title = q2.userName = new RegExp("^.*"+toEscape(search)+".*$", 'i');
  }

  Contest.get ({$or:[q1, q2]}, page, function(err, contests, n) {
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (n < 0) {
      return res.redirect('/contest/'+type);
    }
    var T = new Array(), R = {}, now = (new Date()).getTime(), CS = {};
    if (contests) {
      contests.forEach(function(p, i){
        T.push((new Date(p.startTime)).getTime()-now);
        if (req.session.user && IsRegCon(p.contestants, req.session.user.name))
          R[i] = true;
      });
    }
    if (req.session.cid) {
      CS = req.session.cid;
    }
    res.render ('contest', {title: 'Contest',
                            user: req.session.user,
                            message: req.session.msg,
                            time: now,
                            key: 6,
                            type: type,
                            contests: contests,
                            n: n,
                            search: search,
                            page: page,
                            T: T,
                            R: R,
                            CS: CS
    });
  });
};

exports.addcourse = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.redirect('/course');
  }
  if (!req.session.user.privilege || parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = 'You have no permission to Edit Course!';
    return res.redirect('/course');
  }
  id = parseInt(req.query.id);
  var RP = function(C, P){
    res.render('addcourse', { title: 'AddCourse',
                              user: req.session.user,
                              message: req.session.msg,
                              time: (new Date()).getTime(),
                              course: C,
                              key: 1003,
                              pName: P
    });
  };
  if (!id) {
    return RP(null, {});
  } else {
    Course.watch(id, function(err, course){
      if (err) {
        req.session.msg = '系统错误！';
        return res.redirect('/course');
      }
      Problem.find({problemID: {$in: course.probs}}, function(err, probs){
        if (err) {
          req.session.msg = '系统错误！';
          return res.redirect('/course');
        }
        var pName = {};
        if (probs) {
          probs.forEach(function(p, i){
            pName[p.problemID] = p.title;
          });
        }
        return RP(course, pName);
      });
    });
  }
};

exports.doAddcourse = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Failed! Please login first!';
    return res.end();
  }
  if (!req.session.user.privilege || parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = 'You have no permission to Edit Course!';
    return res.end();
  }
  var title = req.body.title
  ,   a = parseInt(req.body.a, 10)
  ,   b = parseInt(req.body.b, 10);
  if (!title || b < a || b-a+1 > 100) {
    return res.end();   //not allow
  }
  var cid = parseInt(req.body.cid, 10)
  ,   RP = function(ary){
    if (!cid) {
      IDs.get('contestID', function(err, id){
        if (err) {
          req.session.msg = '系统错误！';
          return res.end();
        }
        var course = new Course({
          courseID: id,
          title   : title,
          probs   : ary
        });
        course.save(function(err){
          if (err) {
            req.session.msg = '系统错误！';
            return res.end();
          }
          req.session.msg = 'the Course has been added successfully!';
          return res.end(id.toString());
        });
      });
    } else {
      Course.update(cid, {$set: {title: title}}, function(err){
        if (err) {
          req.session.msg = '系统错误！';
          return res.end();
        }
        if (ary.length == 0) {
          req.session.msg = 'the Course has been updated successfully!';
          return res.end();
        }
        Course.update(cid, {$addToSet: {probs: {$each: ary}}}, function(err){
          if (err) {
            req.session.msg = '系统错误！';
            return res.end();
          }
          req.session.msg = 'the Course has been updated successfully!';
          return res.end();
        });
      });
    }
  };
  if (!a || !b) {
    return RP([]);
  }
  Problem.find({problemID: {$gte:a, $lte:b}}, function(err, problems){
    if (err) {
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (!problems) {
      req.session.msg = 'the problems is Not exist!';
      return res.end();
    }
    var ary = new Array();
    problems.forEach(function(p, i){
      ary.push(p.problemID);
    });
    return RP(ary);
  });
};

exports.onecourse = function(req, res) {
  var id = parseInt(req.params.id, 10);
  if (!id) {
    return res.end('404');
  }
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.redirect('/course');
  }
  if (!req.session.user.privilege) {
    req.session.msg = '对不起，您的权限不足！';
    return res.redirect('/course');
  }
  var page = parseInt(req.query.page, 10);
  if (!page) {
    page = 1;
  } else if (page < 0) {
    return res.end('404');
  }
  User.watch(req.session.user.name, function(err, user){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    req.session.user = user;  //update sesstion
    Course.watch(id, function(err, course){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      if (!course) {
        return res.end('404');
      }
      var q = { problemID: { $in: course.probs } }
      ,   Q, search = req.query.search;
      if (search) {
        q.title = new RegExp("^.*"+toEscape(search)+".*$", 'i');
      }
      if (!req.session.user) {
        Q = {$and: [ q, {hide:false} ]};
      } else if (req.session.user.name != 'admin') {
        Q = {$and: [ q, {$or:[{hide:false}, {manager:req.session.user.name}]} ]};
      } else Q = q;
      Problem.get(Q, page, function(err, problems, n, total) {
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        if (n < 0) {
          return res.redirect('/course');
        }
        var RP = function(R){
          if (!req.query.page && !req.query.search) {
            req.session.msg = '欢迎来到《'+course.title+'》！';
          }
          res.render('onecourse', { title: 'OneCourse',
                                    user: req.session.user,
                                    message: req.session.msg,
                                    time: (new Date()).getTime(),
                                    key: 15,
                                    n: n,
                                    total: total,
                                    problems: problems,
                                    page: page,
                                    search: search,
                                    Tag: Tag,
                                    Pt: ProTil,
                                    R: R,
                                    course: course
          });
        };
        if (req.session.user && problems && problems.length > 0) {
          var pids = new Array(), R = {};
          problems.forEach(function(p){
            pids.push(p.problemID);
          });
          Solution.find({
            problemID: {$in: pids},
            userName: req.session.user.name
          }, function(err, sols){
            if (err) {
              console.log(err);
              req.session.msg = '系统错误！';
              return res.redirect('/');
            }
            if (sols) {
              sols.forEach(function(s){
                if (s.result != 2 && !R[s.problemID]) {
                  R[s.problemID] = 1;
                } else if (s.result == 2 && R[s.problemID] != 2) {
                  R[s.problemID] = 2;
                }
              });
              return RP(R);
            }
          });
        } else {
          return RP({});
        }
      });
    });
  });
};

exports.courseDelete = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Failed! Please login first!';
    return res.end();
  }
  if (parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = 'Failed! You have no permission to delete Course!';
    return res.end();
  }
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();
  }
  Solution.watch({cID: cid}, function(err, sol){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (sol) {
      req.session.msg = 'Can\'t delete the course, because there are some submits in this course!';
      return res.end();
    }
    Course.dele({courseID: cid}, function(err){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      req.session.msg = 'Course '+cid+' has been deleted successfully!';
      return res.end();
    });
  });
};

exports.delCourseProb = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var pid = parseInt(req.body.pid, 10)
  ,   cid = parseInt(req.body.cid, 10);
  if (!pid || !cid) {
    return res.end(); //not allow
  }
  Course.update(cid, {$pull: {probs: pid}}, function(err){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    req.session.msg = '删除成功！';
    return res.end();
  });
};

exports.course = function(req, res) {
  if (!req.query.page) {
    page = 1;
  } else {
    page = parseInt(req.query.page, 10);
  }
  if (!page || page < 0) {
    return res.redirect('/course');
  }
  
  var q = {}, search = req.query.search;

  if (search) {
    q.title = new RegExp("^.*"+toEscape(search)+".*$", 'i');
  }

  Course.get (q, page, function(err, courses, n, total) {
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (n < 0) {
      return res.redirect('/course');
    }
    res.render ('course', {title: 'Course',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            key: 14,
                            courses: courses,
                            n: n,
                            search: search,
                            page: page
    });
  });
};

exports.courseRank = function(req, res) {
  var id = parseInt(req.params.id);
  if (!id) {
    return res.end('404');
  }
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.redirect('/course');
  }
  if (!req.session.user.privilege) {
    req.session.msg = '对不起，您的权限不足！';
    return res.redirect('/course');
  }
  if (req.session.user.privilege == '82' && !req.session.user.grade) {
    var g = (new Date()).getFullYear()%100;
    if (g < 10) g = '0' + g;
    req.session.user.grade = g + '1';
  }
  if (!req.session.user.grade) {
    req.session.msg = '您的班级信息为空，请找老师或管理员完善！';
    return redirect('/course');
  }
  if (!req.session.user.college) {
    req.session.msg = '您的学院信息为空，请找老师或管理员完善！';
    return redirect('/course');
  }
  var RP = function(Q, U){
    Course.watch(id, function(err, course){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      if (!course) {
        return res.end('404');
      }
      Solution.mapReduce({
        map: function(){
          emit(this.userName, {pid:this.problemID, AC:{}, solved:1, submit:1, result:this.result});
        },
        reduce: function(k, vals){
          var val = {pid:null, AC:{}, solved:0, submit:0, result:null};
          vals.forEach(function(p){
            if (p.pid) {
              if (!val.AC[p.pid] && p.result == 2) {
                val.AC[p.pid] = true;
                ++val.solved;
              }
            } else {
              if (p.AC) {
                for (var i in p.AC) {
                  if (!val.AC[i]) {
                    val.AC[i] = true;
                    ++val.solved;
                  }
                }
              }
            }
            val.submit += p.submit;
          });
          return val;
        },
        finalize: function(key, val){
          if (val.pid) {
            if (val.result != 2) {
              return {solved:0, submit:1};
            } else {
              return {solved:1, submit:1};
            }
          }
          return {solved: val.solved, submit: val.submit};
        },
        query: {$and: [{problemID: {$in: course.probs}}, Q] },
        sort: {runID: 1}
      }, function(err, ranks){
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        if (ranks) {
          ranks.sort(function(a, b){
            if (a.value.solved == b.value.solved) {
              if (a.value.submit == b.value.submit) {
                return a._id < b._id ? -1 : 1;
              }
              return a.value.submit < b.value.submit ? -1 : 1;
            }
            return a.value.solved > b.value.solved ? -1 : 1;
          });
        }
        res.render('courserank', {title: 'CourseRank',
                                  user: req.session.user,
                                  message: req.session.msg,
                                  time: (new Date()).getTime(),
                                  key: 16,
                                  ranks: ranks,
                                  course: course,
                                  UI: U
        });
      });
    });
  };
  User.find({college: req.session.user.college, grade: new RegExp('^'+req.session.user.grade+'.*$')}, function(err, users){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    var names = new Array(), UI = {};
    if (users) {
      users.forEach(function(p){
        names.push(p.name);
        UI[p.name] = {
          col : UserCol(p.privilege),
          til : UserTitle(p.privilege),
          gde : p.grade,
          name: p.realname,
          sig : p.signature
        };
      });
    }
    return RP({userName: {$in: names}}, UI);
  });
};

exports.ranklist = function(req, res) {
  var page = parseInt(req.query.page, 10);
  if (!page) {
    page = 1;
  } else if (page < 0) {
    return res.redirect('/ranklist');
  }

  var q1 = {}, q2 = {};
  var search = req.query.search;
  if (search) {
    q1.name = q2.nick = new RegExp("^.*"+toEscape(search)+".*$", 'i');
  }

  User.get({$and:[{$or:[q1, q2]}, {$nor:[{name:'admin'}]} ]}, page, function(err, users, n){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (n < 0) {
      return res.redirect('/ranklist');
    }
    var UC = new Array(), UT = new Array();
    if (users) {
      users.forEach(function(p, i){
        UC.push(UserCol(p.privilege));
        UT.push(UserTitle(p.privilege));
      });
    }
    res.render('ranklist', {title: 'Ranklist',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            key: 5,
                            n: n,
                            users: users,
                            page: page,
                            pageNum: ranklist_pageNum,
                            search: search,
                            UC: UC,
                            UT: UT
    });
  });
};

exports.faq = function(req, res) {
  res.render ('faq', {title: 'Frequently Asked Questions',
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
                        id: req.query.pid
  });
};

exports.doSubmit = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end('1');
  }
  var cid = parseInt(req.body.cid)
  ,   name = req.session.user.name
  ,   pid = parseInt(req.body.pid)
  ,   Str = req.body.code
  ,   RP = function(){
    IDs.get('runID', function(err, id){
      if (err) {
        console.log(err);
        return res.end();
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
          User.update({'name': name}, {$inc: {submit: 1}}, true, function(err){
            if (err) {
              console.log(err);
              return res.end('3');
            }
            if (cid < 0)
              req.session.msg = 'The code for problem '+pid+' has been submited successfully!';
            return res.end();
          });
        });
      });
    });
  };
  if (!cid) {
    cid = -1;
    return RP();
  } else {
    Contest.watch(cid, function(err, contest){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      if (!contest) {
        req.session.msg = 'the Contest is not exist!';
        return res.end(); //not allow
      }
      if (contest.type == 2 && name != contest.userName) {
        if (!contest.contestants || !IsRegCon(contest.contestants, name)) {
          req.session.msg = 'You can not submit because you have not registered the contest yet!';
          return res.end('2');
        }
      }
      return RP();
    });
  }
};

exports.sourcecode = function(req, res) {
  var runid = parseInt(req.params.runid, 10);
  if (!runid) {
    return res.end('the solution is not exist!');
  }
  Solution.watch({runID:runid}, function(err, solution) {
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    var RP = function(flg){
      res.render('sourcecode', {title: 'Sourcecode',
                                user: req.session.user,
                                message: req.session.msg,
                                time: (new Date()).getTime(),
                                key: 11,
                                solution: solution,
                                flg: flg
      });
    };
    if (!req.session.user) {
      return RP(false);
    }
    if (solution && req.session.user.name != solution.userName && req.session.user.name != 'admin') {
      Contest.watch(solution.cID, function(err, contest){
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        if (contest && contest.userName == req.session.user.name) {
          return RP(true);
        }
        return RP(false);
      });
    } else {
      return RP(true);
    }
  });
};

exports.statistic = function(req, res) {
  var pid = parseInt(req.params.pid);
  if (!pid) {
    return res.end('the problem is not exist!');
  }
  var page = parseInt(req.query.page);
  if (!page) {
    page = 1;
  } else if (page < 0) {
    return res.redirect('/statistic/'+pid);
  }
  Problem.watch(pid, function(err, problem){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (!problem) {
      return res.end('the problem is not exist!');
    }
    var lang = parseInt(req.query.lang, 10), Q = {problemID:pid, result:2};
    if (lang) {
      Q.language = lang;
    }
    Solution.distinct('userName', Q, function(err, users){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      var n = 0;
      if (users) n = users.length;
      if ((page-1)*stats_pageNum > n) {
        return res.redirect('/statistic/'+pid);
      }
      var sort_key = parseInt(req.query.sort), sq = {};
      if (!sort_key) {
        sq = {time:1, memory:1, length:1, inDate:1};
      } else if (sort_key == 1) {
        sq = {memory:1, time:1, length:1, inDate:1};
      } else if (sort_key == 2) {
        sq = {length:1, time:1, memory:1, inDate:1};
      }
      var Q1 = { problemID: pid, result: 2 }, Q2 = { problemID: pid, result: {$gt:1} };
      if (lang) {
        Q1.language = Q2.language = lang;
      }
      Solution.aggregate([{
        $match: Q1
      }, {
        $group: {
          _id       : '$userName',
          runID     : { $first : '$runID' },
          cid       : { $first : '$cID' },
          time      : { $first : '$time' },
          memory    : { $first : '$memory' },
          length    : { $first : '$length' },
          language  : { $first : '$language' },
          inDate    : { $first : '$inDate' }
        }
      }, {$sort: sq}, {$skip: (page-1)*stats_pageNum}, {$limit: 20}
      ], function(err, sols){
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        var N = {}, sum = 0, Q = {problemID: pid};
        Solution.aggregate([
          {$match  : Q2}
        , {$group  : { _id: '$result', val: {$sum:1} }}
        ], function(err, results){
          if (err) {
            console.log(err);
            req.session.msg = '系统错误！';
            return res.redirect('/');
          }
          if (results) {
            var sum = 0;
            results.forEach(function(p, i){
              if (p._id > 8 && p._id < 13) {
                i = 9;
              } else {
                i = p._id;
              }
              if (!N[i]) {
                N[i] = p.val;
              } else {
                N[i] += p.val;
              }
              sum += p.val;
            });
            N[0] = sum;
          }
          User.find({name: {$in:users}}, function(err, users){
            if (err) {
              console.log(err);
              req.session.msg = '系统错误！';
              return res.redirect('/');
            }
            var UC = {}, UT = {};
            if (users) {
              users.forEach(function(p){
                UC[p.name] = UserCol(p.privilege);
                UT[p.name] = UserTitle(p.privilege);
              });
            }
            res.render('statistic', { title: 'Problem Statistic',
                                      user: req.session.user,
                                      message: req.session.msg,
                                      time: (new Date()).getTime(),
                                      key: 1,
                                      pid: pid,
                                      sols: sols,
                                      N: N,
                                      Res: Res,
                                      page: page,
                                      pageNum: stats_pageNum,
                                      n: parseInt((n+stats_pageNum-1)/stats_pageNum, 10),
                                      lang: lang,
                                      sort_key: sort_key,
                                      UC: UC,
                                      UT: UT
            });
          });
        });
      });
    });
  });
};

exports.regCon = function(req, res) {
  var page = parseInt(req.query.page, 10);
  if (!page) {
    page = 1;
  } else if (page < 0) {
    return res.redirect('/regform/'+req.query.type);
  }

  var search = req.query.search;

  var RP = function(C, Q, type) {
    Reg.get(Q, page, function(err, regs, n) {
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      if (n < 0) {
        return res.redirect('/regform/'+type);
      }
      var flg = false, has = {}, names = new Array();
      if (regs) {
        regs.forEach(function(p, i){
          if (!has[p.user]) {
            has[p.user] = true;
            names.push(p.user);
          }
        });
      }
      User.find({name: {$in:names}}, function(err, users){
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        var UC = {}, UT = {};
        if (users) {
          users.forEach(function(p){
            UC[p.name] = UserCol(p.privilege);
            UT[p.name] = UserTitle(p.privilege);
          });
        }
        var left, now = (new Date()).getTime();
        if (C) {
          left = (new Date(C.startTime)).getTime() - now - 300000;
        }
        res.render('regform', { title: 'Register Form',
                                user: req.session.user,
                                message: req.session.msg,
                                time: now,
                                key: 2,
                                contest: C,
                                n: n,
                                page: page,
                                search: search,
                                regs: regs,
                                UC: UC,
                                UT: UT,
                                type: type,
                                left: left,
                                C: College
        });
      });
    });
  };

  var q1 = {}, q2 = {};
  if (search) {
    q1.user = q2.realname = new RegExp("^.*"+toEscape(search)+".*$", 'i');
  }

  if (req.params.type == 'apply') {
    return RP(null, {cid:-1}, 'apply');
  }

  var cid = parseInt(req.params.type, 10);
  if (!cid || cid < 0) {
    return res.redirect('/');
  }

  q1.cid = q2.cid = cid;
  
  Contest.watch(cid, function(err, contest){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (!contest || contest.type != 2 || !contest.password) {
      return res.redirect('/');
    }
    return RP(contest, {$or:[q1, q2]}, cid);
  });
};

function regContestAndUpdate(cid, name, callback) {
  Contest.update(cid, {$addToSet: {contestants:name}}, function(err){
    if (err) {
      console.log(err);
      return callback(err);
    }
    var rank = new ContestRank({_id: cid+'-'+name});
    rank.save(function(){
      return callback();  //if insert multiple no need to callback error.
    });
  });
}

exports.contestReg = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = "Please login first!";
    return res.end('1');
  }
  if (req.session.user.name == 'admin') {
    req.session.msg = '管理员无需注册。';
    return res.end();
  }
  var cid = parseInt(req.body.cid);
  Contest.watch(cid, function(err, contest){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (!contest || contest.type != 2 || contest.password) {
      return res.end();
    }
    if (getDate(new Date()) > calDate(contest.startTime, -5)) {
      req.session.msg = "Register is closed.";
      return res.end('1');
    }
    regContestAndUpdate(cid, req.session.user.name, function(err){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      return res.end();
    });
  });
};

function isSameAsBefore(user, reg) {
  return (user.number == reg.number && user.realname == reg.realname &&
  user.sex == reg.sex && user.college == reg.college &&
  user.grade == reg.grade);
}

exports.doRegCon = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录!';
    return res.end('1');
  }
  if (req.session.user.name == 'admin') {
    req.session.msg = '管理员无需注册。';
    return res.end();
  }
  var cid = parseInt(req.body.cid), name = req.session.user.name;
  Reg.findOne({cid:cid, user:name}, function(err, reg){
    if (reg) {
      if (reg.status == 2) {
        req.session.msg = '您已通过审核，无需修改。';
        return res.end();
      }
      reg.regTime = getDate(new Date());
      reg.number = req.body.number;
      reg.realname = req.body.realname;
      reg.sex = req.body.sex;
      reg.college = req.body.college;
      reg.grade = req.body.grade;
      reg.status = 0;
      reg.save(function(err){
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
        } else {
          req.session.msg = '信息修改成功！请等待管理员审核。';
        }
        return res.end();
      });
    } else {
      IDs.get ('regID', function(err, id) {
        var reg = new Reg({
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
        reg.save(function(err) {
          if (err) {
            console.log(err);
            req.session.msg = '系统错误！';
            return res.end();
          }
          if (cid < 0) {
            req.session.msg = '申请成功！请等待管理员审核。';
            return res.end();
          } else {
            User.watch(reg.user, function(err, user) {
              if (err) {
                console.log(err);
                req.session.msg = '系统错误！';
                return res.end();
              }
              if (!user.privilege || !isSameAsBefore(user, reg)) {
                req.session.msg = '报名成功！请等待管理员审核。';
                return res.end();
              }
              Reg.update({regID: id}, {$set: {status: '2'}}, function(err){
                if (err) {
                  console.log(err);
                  req.session.msg = '系统错误！';
                  return res.end();
                }
                regContestAndUpdate(cid, name, function(err){
                  if (err) {
                    console.log(err);
                    req.session.msg = '系统错误！';
                    return res.end();
                  }
                  req.session.msg = '报名成功！';
                  return res.end();
                })
              });
            });
          }
        });
      });
    }
  });
};

exports.regUpdate = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }

  var pvl = parseInt(req.session.user.privilege);
  if (!pvl || pvl < 81) {
    req.session.msg = '你的权限不足';
    return res.end();
  }

  var rid = parseInt(req.body.rid, 10), s = req.body.status;
  if (!rid || !s) {
    return res.end();
  }

  Reg.update({regID: rid}, {$set: {status: s}}, function(err, reg){
    if (err) {
      console.log(err);
      return res.end();
    }
    if (!reg) {
      return res.end();
    }
    if (s == '2') {
      User.watch(reg.user, function(err, user) {
        if (err) {
          console.log(err);
          return res.end();
        }
        if (!user) {
          return res.end();
        }

        var flg = false;
        if (!isSameAsBefore(user, reg)) {
          user.number = reg.number;
          user.realname = reg.realname;
          user.sex = reg.sex;
          user.college = reg.college;
          user.grade = reg.grade;
          flg = true;
        }

        var RP = function(){
          regContestAndUpdate(reg.cid, reg.user, function(err){
            if (err) {
              console.log(err);
              req.session.msg = '系统错误！';
            }
            return res.end();
          });
        };
        if (flg) {
          user.privilege = '70';
          user.save(function(err){
            if (err) {
              console.log(err);
              req.session.msg = '系统错误！';
              return res.end();
            }
            return RP();
          });
        } else {
          return RP();
        }

      });
    } else {
      return res.end();
    }
  });
};

exports.regContestAdd = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = 'Failed! You aren\'t admin';
    return res.end();
  }
  var name = req.body.name;
  if (!name) {
    return res.end();
  }
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();
  }
  Contest.watch(cid, function(err, contest){
    if (err) {
      console.log(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (!contest) {
      return res.end();
    }
    User.watch(name, function(err, user){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      if (!user) {
        req.session.msg = 'The user is not exist.';
        return res.end();
      }
      regContestAndUpdate(cid, name, function(err){
        if (err) {
          console.log(err);
          req.session.msg = '系统错误！';
          return res.end();
        }
        return res.end();
      });
    });
  });
};

exports.changeGrade = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = 'update Failed! You aren\'t admin';
    return res.end();
  }
  Reg.findOne({cid: req.body.cid, user: req.body.name}, function(err, reg){
    if (err) {
      req.session.msg = err;
      return res.end();
    }
    if (!reg) {
      req.session.msg = 'The record is not exist.';
      return res.end();
    }
    reg.grade = req.body.grade;
    reg.save(function(err){
      if (err) {
        console.log(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      req.session.msg = 'Information change complete.';
      return res.end();
    });
  });
};