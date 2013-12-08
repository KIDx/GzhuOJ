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

 8    : problem
 9    : onecontest
 10   : submit
 11   : sourcecode
 12   : avatar
 13   : addstudent
 14   : course
 15   : onecourse
 16   : courserank
 17   : topic
 18   : onetopic
 1000/1001: addproblem
 1002 : addcontest
 1003 : addcourse
 1004 : addtopic

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
,   Group = require('../models/group.js')
,   Topic = require('../models/topic.js')
,   Comment = require('../models/comment.js')
,   Reg = require('../models/reg.js')
,   tCan = require('../models/can.js');

var settings = require('../settings')
,   ranklist_pageNum = settings.ranklist_pageNum
,   stats_pageNum = settings.stats_pageNum
,   contestRank_pageNum = settings.contestRank_pageNum
,   Tag = settings.T
,   ProTil = settings.P
,   Col = settings.C
,   Res = settings.R
,   UserCol = settings.UC
,   UserTitle = settings.UT
,   College = settings.College
,   OE = settings.outputErr
,   getDate = settings.getDate;

var data_path = settings.data_path
,   root_path = settings.root_path;

function nil(n) {
  return (typeof(n) == 'undefined');
}

function trim(s) {
  if (nil(s)) return '';
  return String(s).replace(/(^\s*)|(\s*$)/g, '');
}

function drim(s) {
  if (nil(s)) return '';
  return String(s).replace(/(\s+)/g, ' ');
}

//delete unuseful ' ', '\t', '\n' ect...
function clearSpace(s) {
    return drim(trim(s));
}

function deal(str) {
  var n = parseInt(str, 10);
  if (n < 10) return '0'+n;
  return n;
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

function escapeHtml(s) {
  return s.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function IsRegCon(s, name) {
  if (!s || !s.length) return false;
  for (var i = 0; i < s.length; i++) {
    if (s[i] == name)
      return true;
  }
  return false;
}

function doIconv(data) {
  var str = data.toString();
  if(str.indexOf('�') != -1){
    var gbk_to_utf8 = new Iconv('GBK', 'UTF8');
    str = gbk_to_utf8.convert(data).toString();
  }
  return str;
}

function getTime(n) {
  var m = parseInt(n, 10);
  if (!m) return '';
  var date = new Date(m), now = new Date();
  var y = now.getFullYear() - date.getFullYear();
  if (y > 0) {
    var Y = date.getFullYear();
    var M = date.getMonth()+1;
    if (M < 10) M = '0' + M;
    var D = date.getDate();
    if (D < 10) D = '0' + D;
    var h = date.getHours();
    if (h < 10) h = '0' + h;
    var m = date.getMinutes();
    if (m < 10) m = '0' + m;
    return (Y+'-'+M+'-'+D+' '+h+':'+m);
  }
  var m = now.getMonth() - date.getMonth()
  ,   d = now.getDate() - date.getDate();
  if (m > 0 || d > 0) {
    var M = date.getMonth()+1;
    if (M < 10) M = '0' + M;
    var D = date.getDate();
    if (D < 10) D = '0' + D;
    var h = date.getHours();
    if (h < 10) h = '0' + h;
    var m = date.getMinutes();
    if (m < 10) m = '0' + m;
    return (M+'-'+D+' '+h+':'+m);
  }
  var h = now.getHours() - date.getHours();
  if (h > 0) {
    return (h+'小时前');
  }
  m = now.getMinutes() - date.getMinutes();
  if (m > 0) {
    return (m+'分钟前');
  }
  return '刚刚';
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
  var id = parseInt(req.body.runid, 10);
  if (!id) {
    return res.end();   //not allow
  }
  Solution.watch({runID:id}, function(err, sol){
    if (err) {
      OE(err);
      return res.end(); //not refresh!
    }
    if (!sol || sol.result == 0) {
      return res.end(); //not allow
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
            OE(err);
            return res.end();   //not refresh!
          }
          if (!contest) {
            return res.end();   //not allow
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
    return res.end();   //not allow!
  }
  Solution.mapReduce({
    map: function(){
      var val = { AC:0, all:1 };
      if (this.result == 2) {
        val.AC = 1;
      }
      emit(this.problemID, val);
    },
    reduce: function(key, vals){
      val = { AC:0, all:0, result:null };
      vals.forEach(function(p, i){
        val.all += p.all;
        val.AC += p.AC;
      });
      return val;
    },
    query: {$nor: [{userName:'admin'}], cID: cid},
    sort: {runID: 1}
  }, function(err, results){
    if (err) {
      OE(err);
      return res.end();   //not refresh!
    }
    if (req.session.user) {
      Solution.aggregate([
      { $match: { userName: req.session.user.name, cID: cid, result:{$gt:1} } }
    , { $group: { _id: '$problemID', result: {$min: '$result'} } }
      ], function(err, sols){
        if (err) {
          OE(err);
          return res.end();   //not refresh!
        }
        return res.json([results, sols]);
      });
    } else {
      return res.json([results, null]);
    }
  });
};

exports.getStatus = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();     //not allow!
  }
  Contest.watch(cid, function(err, contest){
    if (err) {
      OE(err);
      return res.end();   //not refresh!
    }
    if (!contest) {
      return res.end();   //not allow
    }
    var Q = {cID: cid}, page, pid, result, lang;
    page = parseInt(req.body.page, 10);
    if (!page) {
      page = 1;
    } else if (page < 0) {
      return res.end();   //not allow!
    }

    if (req.body.name) {
      Q.userName = toEscape(req.body.name);
    }

    pid = parseInt(req.body.pid, 10);
    if (pid) {
      Q.problemID = pid;
    }

    result = parseInt(req.body.result, 10);
    if (result >= 0) {
      if (result > 8 && result < 13) {
        Q.result = {$gt:8, $lt:13};
      } else {
        Q.result = result;
      }
    }

    lang = parseInt(req.body.lang, 10);
    if (lang) {
      Q.language = lang;
    }

    if (!req.session.user || req.session.user.name != 'admin') {
      Q.$nor = [{userName: 'admin'}];
    }
    Solution.get(Q, page, function(err, solutions, n) {
      if (err) {
        OE(err);
        return res.end();     //not refresh!
      }
      if (n < 0) {
        return res.end();     //not allow
      }
      var sols = new Array(), names = new Array(), has = {};
      if (solutions) {
        solutions.forEach(function(p, i){
          var T = '', M = '', L = '';
          if (req.session.user && (req.session.user.name == p.userName ||
              req.session.user.name == contest.userName) ||
              calDate(contest.startTime, contest.len) < getDate(new Date())) {
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
          OE(err);
          return res.end();      //not refresh
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
    updateTime  : { $lt: now-10000 }
  }, {
    $set: { updateTime: now }
  }, {
    new : false
  }, function(err, contest){
    if (err) {
      OE(err);
      return res.end();
    }
    var RP = function(con){
      ContestRank.get({'_id.cid': cid}, page, function(err, users, n){
        if (err) {
          OE(err);
          return res.end();
        }
        if (n < 0) {
          return res.end();
        }
        if (!users || users.length == 0) {
          return res.json([null, {}, {}, n, {}, 0]);
        }
        var has = {}, names = new Array(), stars = new Array()
        ,   pvl = {}, I = {}, Users = new Array()
        ,   V = users[0].value, T = users[0]._id.name;
        if (con.stars) {
          con.stars.forEach(function(p){
            has[p] = true;
          });
        }
        users.forEach(function(p, i){
          var tmp = {name: p._id.name, value: p.value};
          if (has[tmp.name]) {
            tmp.star = true;
          }
          Users.push(tmp);
          names.push(p._id.name);
        });
        if (con.contestants) {
          con.contestants.forEach(function(p){
            if (has[p]) {
              stars.push(p);
            }
          });
        }
        ContestRank.count({
          '_id.cid': cid,
          '_id.name': {$nin: stars},
          $or: [{'value.solved': {$gt: V.solved}},
                {$and: [{'value.solved': V.solved}, {'value.penalty': {$lt: V.penalty}}]},
                {$and: [{'value.solved': V.solved}, {'value.penalty': V.penalty}, {'_id.name': {$lt: T}}]}]
        }, function(err, rank){
          if (err) {
            OE(err);
            return res.end();
          }
          User.find({name: {$in:names}}, function(err, U){
            if (err) {
              OE(err);
              return res.end();
            }
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
            return res.json([Users, pvl, I, n, con.FB, rank+1]);
          });
        });
      });
    };
    if (!contest) {
      Contest.watch(cid, function(err, con){
        if (err) {
          OE(err);
          return res.end();
        }
        if (!con) {
          return res.end();
        }
        return RP(con);
      });
    } else {
      var indate = {$gte: contest.startTime+':00', $lte: calDate(contest.startTime, contest.len)};
      var Q = {
        cID: cid,
        $nor: [{userName:'admin'}],
        inDate: indate,
        runID: {$gt: contest.maxRunID}
      };
      Solution.findMax(Q, function(err, docs){
        if (err) {
          OE(err);
          return res.end();
        }
        if (!docs || docs.length == 0) {
          return RP(contest);
        }
        var maxRunID = docs[0].runID;
        Q.runID.$lte = maxRunID;
        Solution.mapReduce({
          query: Q,
          sort: {runID: -1},
          map: function(){
            var val = { solved:0, penalty:0, status:{} };
            if (this.result == 2) {
              val.solved = 1;
              val.penalty = parseInt((new Date(this.inDate)).getTime()/60000, 10);
              val.status[this.problemID] = {wa: 0, inDate: val.penalty};
            } else {
              val.status[this.problemID] = {wa: -1};
            }
            return emit({cid: this.cID, name: this.userName}, val);
          },
          reduce: function(key, vals){
            var val = { solved: 0, penalty: 0, status: {} };
            for (var j = vals.length-1; j >= 0; j--) {
              p = vals[j];
              if (p.status) {
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
                      val.status[i].inDate = o.inDate;
                      val.penalty += val.status[i].wa*20 + o.inDate;
                    } else {
                      val.status[i].wa += o.wa;
                    }
                  }
                }
              }
            }
            return val;
          },
          out: { reduce: 'ranks' }
        }, function(err){
          if (err) {
            OE(err);
            return res.end();
          }
          Solution.aggregate([{
            $match: {
              cID: cid,
              $nor: [{userName:'admin'}],
              inDate: indate,
              result: 2
            }
          }, { $group: { _id: '$problemID', userName: {$first: '$userName'} } }
          ], function(err, results){
            if (err) {
              OE(err);
              return res.end();
            }
            var FB = {};
            if (results) {
              results.forEach(function(p){
                FB[p._id] = p.userName;
              });
            }
            Contest.findOneAndUpdate({contestID: cid}, {$set: {FB: FB, maxRunID: maxRunID}}, {new: true}, function(err, con){
              if (err) {
                OE(err);
                return res.end();
              }
              return RP(con);
            });
          });
        });
      });
    }
  });
};

exports.getTopic = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();     //not allow
  }
  Contest.watch(cid, function(err, contest){
    if (err) {
      OE(err);
      return res.end();   //not refresh
    }
    if (!contest) {
      return res.end();   //not allow
    }
    var page;
    page = parseInt(req.body.page, 10);
    if (!page) {
      page = 1;
    } else if (page < 0) {
      return res.end();   //not allow
    }
    Topic.get({cid: cid}, page, function(err, topics, n){
      if (err) {
        OE(err);
        return res.end(); //not refresh
      }
      if (n < 0) {
        return res.end(); //not allow
      }
      var names = new Array(), I = {};
      if (topics) {
        topics.forEach(function(p){
          names.push(p.user);
        });
      }
      User.find({name: {$in: names}}, function(err, users){
        if (err) {
          OE(err);
          return res.end();   //not refresh
        }
        if (users) {
          users.forEach(function(p){
            I[p.name] = p.imgType;
          });
        }
        res.json([topics, n, I]);
      });
    });
  });
};

exports.addDiscuss = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.end('2');    //refresh
  }
  var title = clearSpace(req.body.title)
  ,   content = clearSpace(req.body.content)
  ,   name = req.session.user.name
  ,   cid = parseInt(req.body.cid, 10);
  if (!title || !content || !name || ! cid) {
    return res.end();       //not allow
  }
  Contest.watch(cid, function(err, con){
    if (err) {
      OE(err);
      return res.end('1');
    }
    if (con.type == 2 && !IsRegCon(con.contestants, name)) {
      req.session.msg = '发表失败！你还没注册此比赛！';
      return res.end('2');  //refresh
    }
    IDs.get('topicID', function(err, id){
      if (err) {
        OE(err);
        return res.end('1');
      }
      (new Topic({
        id      : id,
        title   : title,
        content : content,
        cid     : cid,
        user    : req.session.user.name,
        inDate  : (new Date()).getTime()
      })).save(function(err){
        if (err) {
          OE(err);
          return res.end('1');
        }
        return res.end();
      });
    });
  });
};

exports.getCE = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user)
    return res.end('Please login first!');
  var rid = parseInt(req.body.rid, 10)
  ,   name = req.session.user.name;
  if (!rid) {
    return res.end();   //not allow
  }
  Solution.watch({runID: rid}, function(err, solution){
    if (err) {
      OE(err);
      return res.end('系统错误！');
    }
    if (!solution) {
      return res.end(); //not allow
    }
    if (name != 'admin' && name != solution.userName) {
      return res.end('You have no permission to watch that Information!');
    }
    return res.end(solution.CE);
  });
};

exports.changePvl = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = 'Failed! You have no permission to do that!';
    return res.end();
  }
  var name = clearSpace(req.body.name)
  ,   pvl = clearSpace(req.body.pvl)
  ,   college = clearSpace(req.body.college)
  ,   realname = clearSpace(req.body.realname)
  ,   sex = clearSpace(req.body.sex)
  ,   gde = clearSpace(req.body.grade);
  if (!name || !pvl || !college || !sex) {
    return res.end();   //not allow
  }
  User.update({name: name}, {$set: {
    privilege   : pvl,
    college     : college,
    realname    : realname,
    sex         : sex,
    grade       : gde
  }}, function(err){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    req.session.msg = 'The Information has been changed successfully!';
    return res.end();
  });
};

exports.changeAddprob = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = 'You have no permission to do that!';
    return res.end();
  }
  var name = clearSpace(req.body.name);
  if (!name) {
    return res.end();   //not allow
  }
  User.watch(name, function(err, user){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    user.addprob = !user.addprob;
    user.save(function(err){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
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
    return res.end();
  }
  if (req.session.user.name != req.body.name) {
    req.session.msg = 'Failed! You have no permission to do that!';
    return res.end();
  }

  var name = clearSpace(req.body.name)
  ,   nick = clearSpace(req.body.nick)
  ,   oldpsw = req.body.oldpassword
  ,   psw = req.body.password
  ,   school = clearSpace(req.body.school)
  ,   email = clearSpace(req.body.email)
  ,   sig = clearSpace(req.body.signature);
  if (!name || !nick || !oldpsw ||
      school.length > 50 || email.length > 50 || sig.length > 200) {
    return res.end();   //not allow
  }

  var md5 = crypto.createHash('md5')
  ,   oldpassword = md5.update(oldpsw).digest('base64');

  User.watch(name, function(err, user){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (!user) {
      return res.end();   //not allow
    }
    if (oldpassword != user.password) {
      return res.end('1');
    }
    var H = {
      nick    : nick,
      school  : school,
      email   : email,
      signature : sig
    };
    if (psw) {
      var Md5 = crypto.createHash('md5');
      H.password = Md5.update(psw).digest('base64');
    }
    User.update({name: name}, H, function(err){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      req.session.msg = 'Your Information has been updated successfully!';
      return res.end();
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
  if (!pid) {
    return res.end();   //not allow!
  }
  Problem.watch(pid, function(err, problem){
    if (err) {
      OE(err);
      return res.end();
    }
    if (!problem) {
      return res.end(); //not allow
    }
    if (req.body.all) {
      return res.json(problem);
    }
    if (problem.hide == true &&
    (!req.session.user || (req.session.user.name != 'admin' && req.session.user.name != problem.manager))) {
      return res.end();
    }
    return res.end(problem.title);
  });
};

exports.editTag = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  var pid = parseInt(req.body.pid, 10)
  ,   tag = parseInt(req.body.tag, 10);
  if (!pid || !tag) {
    return res.end();   //not allow
  }
  var name = req.session.user.name
  ,   RP = function(){
    var Q;
    if (req.body.add) {
      Q = {$addToSet: {tags:tag}};
    } else {
      Q = {$pull: {tags:tag}};
    }
    Problem.update(pid, Q, function(err, problem){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      if (req.body.add) {
        req.session.msg = 'Tag has been added to the problem successfully!';
      } else {
        req.session.msg = 'Tag has been removed from the problem successfully!';
      }
      return res.end();
    });
  };
  Problem.watch(pid, function(err, problem){
    if (err) {
      OE(err);
      return res.end();
    }
    if (!problem) {
      return res.end();   //not allow
    }
    if (req.body.add && problem.tags.length >= 5) {
      req.session.msg = 'The number of tags should not larger than 5!';
      return res.end();
    }
    if (name == 'admin' || name == problem.manager) {
      return RP();
    }
    Solution.watch({problemID:pid, userName:name, result:2}, function(err, solution) {
      if (err) {
        OE(err);
        return res.end();
      }
      if (!solution) {
        return res.end(); //not allow
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
  var name = clearSpace(req.body.name)
  ,   realname = clearSpace(req.body.realname)
  ,   sex = clearSpace(req.body.sex)
  ,   gde = clearSpace(req.body.gde)
  ,   college = clearSpace(req.body.college);
  if (!name || !realname || !sex || !gde || !college) {
    return res.end('4');
  }
  User.watch(name, function(err, user){
    if (err) {
      OE(err);
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
          OE(err);
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
          OE(err);
          return res.end('3');
        }
        return res.end('1');
      });
    }
  });
};

exports.doReg = function(req, res) {
  res.header('Content-Type', 'text/plain');
  var name = clearSpace(req.body.username)
  ,   nick = clearSpace(req.body.nick)
  ,   password = req.body.password
  ,   vcode = req.body.vcode
  ,   school = clearSpace(req.body.school)
  ,   email = clearSpace(req.body.email)
  ,   sig = clearSpace(req.body.signature);
  if (!name || !nick || !password || !vcode ||
      school.length > 50 || email.length > 50 || sig.length > 200) {
    return res.end();   //not allow
  }

  var pattern = new RegExp("^[a-zA-Z0-9_]{2,15}$");
  if (!pattern.test(name)) {
    return res.end();   //not allow
  }
  if (vcode != req.session.verifycode) {
    return res.end('1');
  }

  User.watch(name, function(err, user){
    if (err) {
      OE(err);
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
        OE(err);
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
  if (!req.body.password) {
    return res.end();   //not allow
  }
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
  if (!req.body.psw) {
    return res.end();   //not allow
  }
  var cid = parseInt(req.body.cid, 10);
  if(!cid) {
    return res.end();   //not allow
  }
  Contest.watch(cid, function(err, contest){
    if (err) {
      OE(err);
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
  if (!req.files || !req.files.info) {
    return res.end();   //not allow
  }
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
    fs.readFile(path, function(err, data){
      if (err) {
        OE(err);
        return res.end('3');
      }
      fs.unlink(path, function() {
        if (!req.body.lang) {
          return res.end();   //not allow!
        }
        var pid = parseInt(req.query.pid, 10);
        if (!pid) {
          return res.end();   //not allow!
        }
        Problem.watch(pid, function(err, problem){
          if (err) {
            OE(err);
            return res.end('3');
          }
          if (!problem) {
            return res.end(); //not allow!
          }
          if (!req.session.user) {
            req.session.msg = 'Failed! Please login first!';
            return res.end('4');    //refresh!
          }
          var name = req.session.user.name;
          IDs.get ('runID', function(err, id){
            if (err) {
              OE(err);
              return res.end('3');
            }
            var str = doIconv(data);
            var newSolution = new Solution({
              runID: id,
              problemID: pid,
              userName: name,
              inDate: getDate(new Date()),
              language: req.body.lang,
              length: str.length,
              cID: -1,
              code: str
            });
            newSolution.save(function(err){
              if (err) {
                OE(err);
                return res.end('3');
              }
              Problem.update(pid, {$inc: {submit: 1}}, function(err){
                if (err) {
                  OE(err);
                  return res.end('3');
                }
                User.update({name: name}, {$inc: {submit: 1}}, function(err){
                  if (err) {
                    OE(err);
                    return res.end('3');
                  }
                  req.session.msg = 'The code for problem '+pid+' has been submited successfully!';
                  return res.end();
                });
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
  var pid = parseInt(req.body.pid, 10);
  if (!pid) {
    return res.end();   //not allow
  }
  Problem.watch(pid, function(err, problem) {
    if (err) {
      OE(err);
      return res.end();
    }
    if (!problem) {
      return res.end(); //not allow
    }
    if (req.session.user.name != 'admin' && req.session.user.name != problem.manager) {
      if (!req.body.cid) {
        req.session.msg = 'Failed! You have no permission to do that.';
        return res.end();
      }
      return res.end('0');
    }
    var has = {};
    Problem.update(pid, {$set: {AC: 0}}, function(err){
      if (err) {
        OE(err);
        return res.end();
      }
      Solution.distinct('userName', {problemID:pid, result:2}, function(err, users){
        if (err) {
          OE(err);
          return res.end();
        }
        User.multiUpdate({'name': {$in: users}}, {$inc: {solved:-1}}, function(err){
          if (err) {
            OE(err);
            return res.end();
          }
          Solution.update({problemID:pid}, {$set: {result:0}}, function(err){
            if (err) {
              OE(err);
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

exports.recal = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  if (req.session.user.name != 'admin') {
    req.session.msg = 'Failed! You have no permission to Add or Edit problem.';
    return res.end();
  }
  Solution.mapReduce({
    map: function() {
      emit(this.userName, {pids:null, submit:1, pid:this.problemID, result:this.result});
    },
    reduce: function(k, vals) {
      var val = {submit:0};
      val.pids = new Array();
      vals.forEach(function(p){
        val.submit += p.submit;
        if (p.pids) {
          p.pids.forEach(function(i){
            val.pids.push(i);
          });
        } else if (p.result == 2) {
          val.pids.push(p.pid);
        }
      });
      return val;
    },
    finalize: function(key, val) {
      if (!val.pids) {
        if (val.result == 2) {
          return {solved:1, submit:1};
        } else {
          return {solved:0, submit:1};
        }
      } else {
        var has = {}, solved = 0;
        val.pids.sort().forEach(function(p){
          if (!has[p]) {
            has[p] = true;
            ++solved;
          }
        });
        return {solved:solved, submit:val.submit};
      }
    },
    sort: {runID: -1}
  }, function(err, U){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (!U) {
      return res.end();
    }
    var k = U.length
    , dfs = function(x) {
      if (x == k) {
        req.session.msg = '统计完成！';
        return res.end();
      }
      User.update({name:U[x]._id}, {$set:U[x].value}, function(err){
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.end();
        }
        dfs(x+1);
      });
    };
    return dfs(0);
  });
};

exports.index = function(req, res){
  //IDs.Init();
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
    return res.end('404');
  }
  User.watch(name, function(err, user){
    if (err) {
      req.session.msg = '系统错误！';
      OE(err);
      return res.redirect('/');
    }
    if (!user) {
      return res.end('404');
    }
    if (!user.addprob) user.addprob = 0;
    else user.addprob = 1;
    Solution.find({userName:name}, function(err, solutions) {
      if (err) {
        req.session.msg = '系统错误！';
        OE(err);
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
      var RP = function(H) {
        res.render('user', {title: 'User',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            key: 0,
                            u: user,
                            A: A.sort(),
                            B: B.sort(),
                            C: College,
                            H: H,
                            UC: UserCol,
                            UT: UserTitle
        });
      };
      if (user.name != 'admin') {
        User.count({
          $nor: [{name: 'admin'}],
          $or:[
            { solved: {$gt: user.solved} },
            { solved: user.solved, submit: {$lt: user.submit} },
            { solved: user.solved, submit: user.submit, name: {$lt: user.name} }
          ]
        }, function(err, rank){
          if (err) {
            req.session.msg = '系统错误！';
            OE(err);
            return res.redirect('/');
          }
          user.rank = rank + 1;
          return RP(null);
        });
      } else {
        Problem.find({hide:true}, function(err, problems){
          if (err) {
            req.session.msg = '系统错误！';
            OE(err);
            return res.redirect('/');
          }
          return RP(problems);
        });
      }
    });
  });
};

exports.avatar = function(req, res) {
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
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
  if (!req.files || !req.files.img) {
    return res.end();   //not allow
  }
  var path = req.files.img.path
  ,   sz = req.files.img.size
  ,   tmp = req.files.img.type.split('/')
  ,   imgType = tmp[1];
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
    var pre = root_path+'public/img/avatar/' + req.session.user.name;
    exec('rm -rf '+pre, function(){
      fs.mkdir(pre, function(err){
        if (err) {
          OE(err);
          return res.end('3');
        }
        var originImg = imageMagick(path);
        originImg.resize(250, 250, '!') //加('!')强行把图片缩放成对应尺寸250*250！
        .autoOrient()
        .write(pre+'/1.'+imgType, function(err){
          if (err) {
            OE(err);
            return res.end('3');
          }
          originImg.resize(150, 150, '!')
          .autoOrient()
          .write(pre+'/2.'+imgType, function(err){
            if (err) {
              OE(err);
              return res.end('3');
            }
            originImg.resize(75, 75, '!')
            .autoOrient()
            .write(pre+'/3.'+imgType, function(err){
              if (err) {
                OE(err);
                return res.end('3');
              }
              originImg.resize(50, 50, '!')
              .autoOrient()
              .write(pre+'/4.'+imgType, function(err){
                if (err) {
                  OE(err);
                  return res.end('3');
                }
                if (imgType != req.session.user.imgType) {
                  User.update({name:req.session.user.name}, {imgType:imgType}, function(err){
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
  if (!req.files || !req.files.csv) {
    return res.end();   //not allow
  }
  var path = req.files.csv.path;
  if (!req.session.user || req.session.user.name != 'admin') {
    fs.unlink(path, function(){
      return res.end();
    });
  } else {
    fs.readFile(path, function(err, data){
      if (err) {
        OE(err);
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
        OE('csv error: '+err.message);
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
    if (P) {
      P.description = escapeHtml(P.description);
      P.input = escapeHtml(P.input);
      P.output = escapeHtml(P.output);
      P.hint = escapeHtml(P.hint);
    }
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
        OE(err);
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
      fs.readdir(root_path+'public/img/prob/'+pid, function(err, imgs){
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
  var pid = parseInt(req.body.pid, 10);
  if (pid) {
    var title = clearSpace(req.body.Title);
    if (!title) title = 'NULL';
    var spj = parseInt(req.body.isSpj, 10);
    if (!spj) spj = 0;
    var tle = parseInt(req.body.Timelimit, 10);
    if (!tle) tle = 1000;
    var mle = parseInt(req.body.Memorylimit, 10);
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
      source: clearSpace(req.body.Source),
      spj: spj,
      timeLimit: tle,
      memoryLimit: mle,
      hide: hide,
      TC: tc
    }}, function(err) {
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      req.session.msg = 'Problem '+pid+' has been updated successfully!';
      return res.redirect('/problem?pid='+pid);
    });
  } else {
    IDs.get ('problemID', function(err, id) {
      if (err) {
        OE(err);
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
          OE(err);
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
  if (!req.files || !req.files.info) {
    return res.end();   //not allow
  }
  var path = req.files.info.path
  ,   sz = req.files.info.size;
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
        OE(err);
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
            OE(err);
            return res.end('3');
          }
          if (!user || !user.addprob) {
            return res.end(); //not allow
          }
          var pre = root_path+'public/img/prob/'+pid;
          fs.mkdir(pre, function(){
            fs.writeFile(pre+'/'+req.files.info.name, data, function(err){
              if (err) {
                OE(err);
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
  var pid = parseInt(req.query.pid, 10);
  if (!pid || !req.files || !req.files.data) {
    return res.end();   //not allow
  }
  var path = req.files.data.path
  ,   fname = req.files.data.name
  ,   sz = req.files.data.size;
  if (sz > 10*1024*1024) {
    return res.end('2');
  }
  fs.readFile(path, function(err, data){
    if (err) {
      OE(err);
      return res.end('3');
    }
    fs.unlink(path, function() {
      if (!req.session.user) {
        return res.end();
      }
      User.watch(req.session.user.name, function(err, user){
        if (err) {
          OE(err);
          return res.end('3');
        }
        if (!user || !user.addprob) {
          return res.end();
        }
        fs.writeFile(data_path+pid+'/'+fname, data, function(err){
          if (err) {
            OE(err);
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
    return res.end();   //not allow
  }
  var pid = parseInt(req.body.pid, 10);
  if (!pid) {
    return res.end();   //not allow
  }
  var fname = req.body.fname;
  if (!fname) {
    return res.end();   //not allow
  }
  User.watch(req.session.user.name, function(err, user){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end('1');    //refresh!
    }
    if (!user || !user.addprob) {
      return res.end();       //not allow!
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
    return res.end();   //not allow!
  }
  var fname = req.body.fname;
  if (!fname) {
    return res.end();   //not allow!
  }
  User.watch(req.session.user.name, function(err, user){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end('1');    //refresh!
    }
    if (!user || !user.addprob) {
      return res.end(); //not allow!
    }
    fs.unlink(root_path+'public/img/prob/'+pid+'/'+fname, function(){
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
    if (req.session.user) {
      name = req.session.user.name;
    }
    Solution.watch({problemID:pid, userName:name, result:2}, function(err, solution) {
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      var pvl = 0;
      if (solution) {
        pvl = 1;
      }
      Problem.watch(pid, function(err, problem) {
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        var RP = function(U){
          var UT, UC;
          if (U) {
            UT = UserTitle(U.privilege);
            UC = UserCol(U.privilege);
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
                                  cid: cid,
                                  UT: UT,
                                  UC: UC
          });
        };
        if (problem) {
          if (pvl == 0 && (name == 'admin' || problem.manager == name)) {
            pvl = 1;
          }
          if (problem.hide == true && (!req.session.user ||
            (req.session.user.name != 'admin' && req.session.user.name != problem.manager))) {
            problem = null;
            return RP(null);
          }
          if (!problem.manager) {
            problem.manager = 'admin';
          }
          User.watch(problem.manager, function(err, user){
            if (err) {
              OE(err);
              req.session.msg = '系统错误！';
              return res.redirect('/');
            }
            return RP(user);
          });
        } else {
          return RP(null);
        }
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
    Q = { $or:[q1, q2, q3], hide:false };
  } else if (req.session.user.name != 'admin') {
    Q = { $and: [{$or:[q1, q2, q3]}, {$or:[{hide:false}, {manager:req.session.user.name}]}] };
  } else Q = { $or:[q1, q2, q3] };
  Problem.get(Q, page, function(err, problems, n) {
    if (err) {
      OE(err);
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
          OE(err);
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
  if (name) {
    Q.userName = toEscape(name);
  }

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
      OE(err);
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
        OE(err);
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
  tcid = parseInt(req.query.cID, 10);
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
  if (!req.session.user) {
    req.session.msg = 'Failed! Please login first!';
    return res.end();
  }
  var type = parseInt(req.body.type, 10);
  if (type == 2 && req.session.user.name != 'admin') {
    req.session.msg = 'Failed! You have no permission to add VIP Contest!';
    return res.end();
  }
  if (type == 3 && parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = 'Failed! You have no permission to add Exam!';
    return res.end();
  }
  var password = ''
  ,   ctitle = clearSpace(req.body.ctitle)
  ,   cdate = clearSpace(req.body.cdate)
  ,   chour = deal(req.body.chour)
  ,   cmin = deal(req.body.cminute)
  ,   cDay = parseInt(req.body.cDay, 10)
  ,   cHour = parseInt(req.body.cHour, 10)
  ,   cMin = parseInt(req.body.cMinute, 10)
  ,   desc = clearSpace(req.body.Description)
  ,   anc = clearSpace(req.body.Announcement);

  if (!ctitle || !cdate || nil(chour) ||
      nil(cmin) || nil(cDay) || nil(cHour) || nil(cMin)) {
    return res.end();   //not allow!
  }

  if (type == 2) {
    password = req.body.cpassword;
  } else if (req.body.cpassword) {
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
  var cid = parseInt(req.body.cid, 10);
  if (cid >= 1000) {
    newContest.contestID = cid;
    Contest.watch(cid, function(err, con) {
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      if (!con) {
        return res.end();
      }
      if (req.session.user.name != con.userName) {
        req.session.msg = 'Update Failed! You are not the manager!';
        return res.end();
      }
      con.title = newContest.title;
      var flg = false;
      if (con.startTime != newContest.startTime) {
        con.startTime = newContest.startTime;
        flg = true;
      }
      if (con.len > newContest.len) {
        flg = true;
      }
      con.len = newContest.len;
      if (flg) con.updateTime = con.maxRunID = 0;
      con.description = newContest.description;
      con.msg = newContest.msg;
      con.probs =  ary;
      con.password = newContest.password;
      con.save(function(err){
        if (err) {
          OE(err);
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
        if (con.type == 2) {
          ContestRank.update({'_id.cid':cid}, {$set:{value:{solved:0,penalty:0,status:{}}}}, function(err){
            if (err) {
              OE(err);
              req.session.msg = '系统错误！';
              return res.end();
            }
            return res.end(tp);
          });
        } else {
          ContestRank.remove({'_id.cid':cid}, function(err){
            if (err) {
              OE(err);
              req.session.msg = '系统错误！';
              return res.end();
            }
            return res.end(tp);
          });
        }
      });
    });
  } else {
    IDs.get ('contestID', function(err, id) {
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      newContest.contestID = id;
      newContest.userName = req.session.user.name;
      newContest.probs = ary;
      newContest.type = type;
      newContest.save(function(err) {
        if (err) {
          OE(err);
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
    return res.end('404');
  }
  Contest.watch(cid, function(err, contest) {
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (!contest) {
      return res.end('404');
    }
    if (contest.type == 3) {
      if (!req.session.user) {
        req.session.msg = '请先登录！';
        return res.redirect('/contest/3');
      }
      if (!req.session.user.privilege) {
        req.session.msg = '抱歉，普通用户无法进入！';
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
    User.watch(contest.userName, function(err, user){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      if (!user) {
        return res.end();   //not allow
      }
      res.render('onecontest', {title: 'OneContest',
                                user: req.session.user,
                                message: req.session.msg,
                                time: (new Date()).getTime(),
                                key: 9,
                                contest: contest,
                                getDate: getDate,
                                isContestant: isContestant,
                                pageNum: contestRank_pageNum,
                                MC: UserCol(user.privilege),
                                MT: UserTitle(user.privilege)
      });
    });
  });
};

exports.contestDelete = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    return res.end();   //not allow
  }
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();   //not allow
  }
  var name = req.session.user.name;
  if (!name) {
    return res.end();   //not allow
  }
  Solution.watch({cID: cid}, function(err, sol){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (sol) {
      req.session.msg = 'Can\'t delete the contest, because there are some submits in this contest!';
      return res.end();
    }
    Contest.dele({contestID: cid, userName: name}, function(err){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      req.session.msg = 'Contest '+cid+' has been Deleted successfully!';
      return res.end();
    });
  });
};

exports.show = function(req, res) {
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();     //not allow
  }
  Contest.watch(cid, function(err, contest){
    if (err) {
      OE(err);
      return res.end('1');
    }
    if (!contest || !contest.probs) {
      return res.end();   //not allow!
    }
    var pids = new Array();
    contest.probs.forEach(function(p){
      pids.push(p[0]);
    });
    Problem.multiUpdate({problemID: {$in: pids}}, {hide: false}, function(err){
      if (err) {
        OE(err);
        return res.end('1');
      }
      return res.end();
    });
  });
};

exports.contest = function(req, res) {
  var type = parseInt(req.params.type, 10);
  if (!type || type < 0 || type > 3) {
    return res.end('404');
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
      OE(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (n < 0) {
      return res.redirect('/contest/'+type);
    }
    var T = new Array(), R = {}, now = (new Date()).getTime(),
        CS = {}, names = new Array();
    if (contests) {
      if (req.session.cid) {
        CS = req.session.cid;
      }
      contests.forEach(function(p, i){
        names.push(p.userName);
        T.push((new Date(p.startTime)).getTime()-now);
        if (req.session.user && IsRegCon(p.contestants, req.session.user.name))
          R[i] = true;
      });
    }
    User.find({name: {$in: names}}, function(err, users){
      if (err) {
        OE(err);
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
                              CS: CS,
                              UC: UC,
                              UT: UT
      });
    });
  });
};

exports.addcourse = function(req, res) {
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.redirect('/course');
  }
  if (!req.session.user.privilege || parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = '对不起，您的权限不足！';
    return res.redirect('/course');
  }
  id = parseInt(req.query.id, 10);
  var RP = function(C, P, G){
    res.render('addcourse', { title: 'AddCourse',
                              user: req.session.user,
                              message: req.session.msg,
                              time: (new Date()).getTime(),
                              course: C,
                              key: 1003,
                              pName: P,
                              groups: G
    });
  };
  if (!id) {
    return RP(null, {}, null);
  }
  Course.watch(id, function(err, course){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.redirect('/course');
    }
    if (!course) {
      return res.end('404');    //not allow
    }
    Group.find({id: {$in: course.groups}}, function(err, groups){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.redirect('/course');
      }
      var ps = new Array();
      if (groups) {
        groups.forEach(function(p){
          p.pids.forEach(function(i){
            ps.push(i);
          });
        });
      }
      Problem.find({problemID: {$in: ps}}, function(err, probs){
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.redirect('/course');
        }
        var pName = {};
        if (probs) {
          probs.forEach(function(p, i){
            pName[p.problemID] = p.title;
          });
        }
        return RP(course, pName, groups);
      });
    });
  });
};

exports.changeCourseTitle = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.end('2');    //reflash
  }
  if (!req.session.user.privilege || parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = '对不起，您的权限不足！';
    return res.end('2');    //reflash
  }
  var cid = parseInt(req.body.cid, 10)
  ,   title = clearSpace(req.body.title);
  if (!cid || !title) {
    return res.end();   //not allow
  }
  Course.update(cid, {$set: {title: title}}, function(err){
    if (err) {
      OE(err);
      return res.end('1');
    }
    return res.end();
  });
};

exports.changeGroupName = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.end('2');    //reflash
  }
  if (!req.session.user.privilege || parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = '对不起，您的权限不足！';
    return res.end('2');    //reflash
  }
  var gid = parseInt(req.body.gid, 10)
  ,   name = clearSpace(req.body.name);
  if (!gid || !name) {
    return res.end();   //not allow
  }
  Group.update(gid, {$set: {name: name}}, function(err){
    if (err) {
      OE(err);
      return res.end('1');
    }
    return res.end();
  });
};

exports.addGroup = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.end('2');    //reflash
  }
  if (!req.session.user.privilege || parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = '对不起，您的权限不足！';
    return res.end('2');    //reflash
  }
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();   //not allow
  }
  Course.watch(cid, function(err, course){
    if (err) {
      OE(err);
      return res.end('1');
    }
    if (!course) {
      return res.end(); //not allow
    }
    if (course.groups.length >= 15) {
      return res.end('3');
    }
    IDs.get('groupID', function(err, id){
      if (err) {
        OE(err);
        return res.end('1');
      }
      (new Group({id: id})).save(function(err){
        if (err) {
          OE(err);
          return res.end('1');
        }
        Course.update(cid, {$addToSet: {groups: id}}, function(err){
          if (err) {
            OE(err);
            return res.end('1');
          }
          return res.end(id.toString());
        });
      });
    });
  });
};

exports.delGroup = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.end('2');    //reflash
  }
  if (!req.session.user.privilege || parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = '对不起，您的权限不足！';
    return res.end('2');    //reflash
  }
  var cid = parseInt(req.body.cid, 10)
  ,   gid = parseInt(req.body.gid, 10);
  if (!cid || !gid) {
    return res.end();   //not allow
  }
  Course.watch(cid, function(err, course){
    if (err) {
      OE(err);
      return res.end('1');
    }
    if (!course) {
      return res.end(); //not allow
    }
    if (course.groups.length < 2) {
      return res.end('3');
    }
    Group.remove({id: gid}, function(err){
      if (err) {
        OE(err);
        return res.end('1');
      }
      Course.update(cid, {$pull: {groups: gid}}, function(err){
        if (err) {
          OE(err);
          return res.end('1');
        }
        return res.end();
      });
    });
  });
};

exports.addProbToGroup = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.end('2');    //reflash
  }
  if (!req.session.user.privilege || parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = '对不起，您的权限不足！';
    return res.end('2');    //reflash
  }
  var gid = parseInt(req.body.gid, 10)
  ,   str = clearSpace(req.body.str);
  if (!gid || !str) {
    return res.end();   //not allow
  }
  var pids = str.split(' ');
  Problem.find({problemID: {$in: pids}}, function(err, probs){
    if (err) {
      OE(err);
      return res.end('1');
    }
    var tmp = new Array(), P = {};
    if (probs) {
      probs.forEach(function(p){
        P[p.problemID] = p.title;
        tmp.push(p.problemID);
      });
    }
    Group.watch(gid, function(err, group){
      if (err) {
        OE(err);
        return res.end('1');
      }
      var n = 0, has = {};
      if (group) {
        group.pids.forEach(function(p){
          has[p] = true;
        });
        n = group.pids.length;
      }
      tmp.forEach(function(p){
        if (!has[p]) {
          has[p] = true;
          ++n;
        }
      });
      if (n > 10) {
        return res.end('3');
      }
      Group.update(gid, {$addToSet: {pids: {$each: tmp}}}, function(err){
        if (err) {
          OE(err);
          return res.end('1');
        }
        return res.json(P);
      });
    });
  });
};

exports.delProbInGroup = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.end('2');    //reflash
  }
  if (!req.session.user.privilege || parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = '对不起，您的权限不足！';
    return res.end('2');    //reflash
  }
  var gid = parseInt(req.body.gid, 10)
  ,   pid = parseInt(req.body.pid, 10);
  if (!gid || !pid) {
    return res.end();   //not allow
  }
  Group.update(gid, {$pull: {pids: pid}}, function(err){
    if (err) {
      OE(err);
      return res.end('1');
    }
    return res.end();
  });
};

exports.doAddcourse = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.end();
  }
  if (!req.session.user.privilege || parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = '对不起，您的权限不足！';
    return res.end();
  }
  var title = clearSpace(req.body.title);
  if (!title) {
    return res.end();   //not allow
  }
  IDs.get('contestID', function(err, id){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    IDs.get('groupID', function(err, gid){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      (new Group({id: gid})).save(function(err){
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.end();
        }
        var groups = new Array();
        groups.push(gid);
        var course = new Course({
          courseID  : id,
          title     : title,
          groups    : groups
        });
        course.save(function(err){
          if (err) {
            OE(err);
            req.session.msg = '系统错误！';
            return res.end();
          }
          req.session.msg = '课程新建成功！';
          return res.end(id.toString());
        });
      });
    });
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
    req.session.msg = '抱歉，普通用户无法进入！';
    return res.redirect('/course');
  }
  Course.watch(id, function(err, course){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (!course) {
      return res.end('404');
    }
    var RP = function(R, P, G, n) {
      res.render('onecourse', { title: 'OneCourse',
                                user: req.session.user,
                                message: req.session.msg,
                                time: (new Date()).getTime(),
                                key: 15,
                                Tag: Tag,
                                Pt: ProTil,
                                R: R,
                                P: P,
                                groups: G,
                                course: course,
                                n: n
      });
    };
    Group.find({id: {$in: course.groups}}, function(err, groups){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      var pids = new Array(), has = {};
      if (groups) {
        groups.forEach(function(p){
          p.pids.forEach(function(i){
            if (!has[i]) {
              has[i] = true;
              pids.push(i);
            }
          });
        });
      }
      Problem.find({problemID: {$in: pids}}, function(err, probs){
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        if (!probs || !probs.length) {
          return RP(null, null, groups, 0);
        }
        var P = {};
        probs.forEach(function(p){
          P[p.problemID] = p;
        });
        Solution.find({
          problemID: {$in: pids},
          userName: req.session.user.name
        }, function(err, sols){
          if (err) {
            OE(err);
            req.session.msg = '系统错误！';
            return res.redirect('/');
          }
          var R = {};
          if (sols) {
            sols.forEach(function(s){
              if (s.result != 2 && !R[s.problemID]) {
                R[s.problemID] = 1;
              } else if (s.result == 2 && R[s.problemID] != 2) {
                R[s.problemID] = 2;
              }
            });
          }
          return RP(R, P, groups, probs.length);
        });
      });
    });
  });
};

exports.courseDelete = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.end();
  }
  if (parseInt(req.session.user.privilege, 10) < 82) {
    req.session.msg = '对不起，您的权限不足！';
    return res.end();
  }
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();   //not allow
  }
  Course.remove({courseID: cid}, function(err){
    if (err) {
      OE(err);
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
      OE(err);
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
    req.session.msg = '您的班级信息为空，请找管理员完善！';
    return redirect('/course');
  }
  if (!req.session.user.college) {
    req.session.msg = '您的学院信息为空，请找管理员完善！';
    return redirect('/course');
  }
  var RP = function(Q, C, U){
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
      query: Q,
      sort: {runID: 1}
    }, function(err, ranks){
      if (err) {
        OE(err);
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
                                course: C,
                                UI: U
      });
    });
  };
  User.find({college: req.session.user.college, grade: new RegExp('^'+req.session.user.grade+'.*$')}, function(err, users){
    if (err) {
      OE(err);
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
    Course.watch(id, function(err, course){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      if (!course) {
        return res.end('404');
      }
      Group.find({id: {$in: course.groups}}, function(err, groups){
        var pids = new Array();
        if (groups) {
          groups.forEach(function(p){
            p.pids.forEach(function(i){
              pids.push(i);
            });
          });
        }
        return RP({$and: [{problemID: {$in: pids}}, {userName: {$in: names}}] }, course, UI);
      });
    });
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

  User.get({ $or:[q1, q2], $nor:[{name:'admin'}] }, page, function(err, users, n){
    if (err) {
      OE(err);
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
  var cid = parseInt(req.body.cid, 10)
  ,   name = clearSpace(req.session.user.name)
  ,   pid = parseInt(req.body.pid, 10)
  ,   Str = String(req.body.code)
  ,   lang = clearSpace(req.body.lang);
  if (!name) {
    return res.end();   //not allow
  }
  if (!pid || !Str || !lang || Str.length < 50 || Str.length > 65536) {
    return res.end('4');
  }
  var RP = function(){
    IDs.get('runID', function(err, id){
      if (err) {
        OE(err);
        return res.end('3');
      }
      Str = doIconv(Str);
      var newSolution = new Solution({
        runID: id,
        problemID: pid,
        userName: name,
        inDate: getDate(new Date()),
        language: parseInt(lang, 10),
        length: Str.length,
        cID: cid,
        code: Str
      });
      newSolution.save(function(err){
        if (err) {
          OE(err);
          return res.end('3');
        }
        Problem.update(pid, {$inc: {submit: 1}}, function(err){
          if (err) {
            OE(err);
            return res.end('3');
          }
          User.update({name: name}, {$inc: {submit: 1}}, function(err){
            if (err) {
              OE(err);
              return res.end('3');
            }
            if (cid < 0) {
              req.session.msg = 'The code for problem '+pid+' has been submited successfully!';
            }
            return res.end();
          });
        });
      });
    });
  };
  Problem.watch(pid, function(err, problem){
    if (err) {
      OE(err);
      return res.end('3');
    }
    if (!problem) {
      return res.end('4');
    }
    if (!cid) {
      cid = -1;
      return RP();
    } else {
      Contest.watch(cid, function(err, contest){
        if (err) {
          OE(err);
          return res.end('3');
        }
        if (!contest) {
          return res.end(); //not allow
        }
        if (contest.type == 2 && name != contest.userName &&
          (!contest.contestants || !IsRegCon(contest.contestants, name))) {
          req.session.msg = 'You can not submit because you have not registered the contest yet!';
          return res.end('2');
        }
        return RP();
      });
    }
  });
};

exports.sourcecode = function(req, res) {
  var runid = parseInt(req.params.runid, 10);
  if (!runid) {
    return res.end('404');
  }
  Solution.watch({runID:runid}, function(err, solution) {
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (!solution) {
      return res.end('404');
    }
    var RP = function(flg){
      res.render('sourcecode', {title: 'Sourcecode',
                                user: req.session.user,
                                message: req.session.msg,
                                time: (new Date()).getTime(),
                                key: 11,
                                solution: solution,
                                flg: flg,
                                Res: Res
      });
    };
    if (!req.session.user) {
      return RP(false);
    }
    if (solution && req.session.user.name != solution.userName &&
        req.session.user.name != 'admin' && req.session.user.privilege != '82') {
      Contest.watch(solution.cID, function(err, contest){
        if (err) {
          OE(err);
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
  var pid = parseInt(req.params.pid, 10);
  if (!pid) {
    return res.end('404');
  }
  var page = parseInt(req.query.page, 10);
  if (!page) {
    page = 1;
  } else if (page < 0) {
    return res.redirect('/statistic/'+pid);
  }
  Problem.watch(pid, function(err, problem){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (!problem) {
      return res.end('404');
    }
    var lang = parseInt(req.query.lang, 10), Q = {problemID:pid, result:2};
    if (lang) {
      Q.language = lang;
    }
    Solution.distinct('userName', Q, function(err, users){
      if (err) {
        OE(err);
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
      }, {$sort: sq}, {
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
          OE(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        var N = {}, sum = 0, Q = {problemID: pid};
        Solution.aggregate([
          {$match  : Q2}
        , {$group  : { _id: '$result', val: {$sum:1} }}
        ], function(err, results){
          if (err) {
            OE(err);
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
              OE(err);
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
  var cid = parseInt(req.params.type, 10);
  if (!cid || cid < 0) {
    return res.end('404');
  }
  var page = parseInt(req.query.page, 10);
  if (!page) {
    page = 1;
  } else if (page < 0) {
    return res.redirect('/regform/'+cid);
  }

  var search = req.query.search;
  var RP = function(C, Q, type) {
    Reg.get(Q, page, function(err, regs, n) {
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      if (n < 0) {
        return res.redirect('/regform/'+cid);
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
          OE(err);
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
        left = (new Date(C.startTime)).getTime() - now - 300000;
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

  var q1 = {cid:cid}, q2 = {cid:cid};
  if (search) {
    q1.user = q2.realname = new RegExp("^.*"+toEscape(search)+".*$", 'i');
  }
  Contest.watch(cid, function(err, contest){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (!contest || contest.type != 2 || !contest.password) {
      return res.end('404');
    }
    return RP(contest, {$or:[q1, q2]}, cid);
  });
};

function regContestAndUpdate(cid, name, callback) {
  Contest.update(cid, {$addToSet: {contestants:name}}, function(err){
    if (err) {
      return callback(err);   //no need to output err, because of callback
    }
    ContestRank.findOne({_id: {cid:cid, name:name}}, function(err, doc){
      if (err) {
        return callback(err);
      }
      if (doc) {
        return callback();
      }
      var rank = new ContestRank(cid, name);
      rank.save(function(){
        return callback();
      });
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
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (!contest || contest.type != 2 || contest.password) {
      return res.end();   //not allow
    }
    if (getDate(new Date()) > calDate(contest.startTime, -5)) {
      req.session.msg = "Register is closed.";
      return res.end('1');
    }
    regContestAndUpdate(cid, req.session.user.name, function(err){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      req.session.msg = '注册成功！';
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
  var number = clearSpace(req.body.number)
  ,   realname = clearSpace(req.body.realname)
  ,   sex = clearSpace(req.body.sex)
  ,   college = clearSpace(req.body.college)
  ,   grade = clearSpace(req.body.grade);
  if (!number || !realname || !sex || !college || !grade) {
    return res.end();   //not allow
  }
  Reg.findOne({cid:cid, user:name}, function(err, reg){
    if (reg) {
      if (reg.status == 2) {
        req.session.msg = '您已通过审核，无需修改。';
        return res.end();
      }
      reg.regTime = getDate(new Date());
      reg.number = number;
      reg.realname = realname;
      reg.sex = sex;
      reg.college = college;
      reg.grade = grade;
      reg.status = 0;
      reg.save(function(err){
        if (err) {
          OE(err);
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
          number: number,
          realname: realname,
          sex: sex,
          college: college,
          grade: grade
        });
        reg.save(function(err) {
          if (err) {
            OE(err);
            req.session.msg = '系统错误！';
            return res.end();
          }
          if (cid < 0) {
            req.session.msg = '申请成功！请等待管理员审核。';
            return res.end();
          } else {
            User.watch(reg.user, function(err, user) {
              if (err) {
                OE(err);
                req.session.msg = '系统错误！';
                return res.end();
              }
              if (!user.privilege || !isSameAsBefore(user, reg)) {
                req.session.msg = '报名成功！请等待管理员审核。';
                return res.end();
              }
              Reg.update({regID: id}, {$set: {status: '2'}}, function(err){
                if (err) {
                  OE(err);
                  req.session.msg = '系统错误！';
                  return res.end();
                }
                regContestAndUpdate(cid, name, function(err){
                  if (err) {
                    OE(err);
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

  var pvl = parseInt(req.session.user.privilege, 10);
  if (!pvl || pvl < 81) {
    req.session.msg = '你的权限不足';
    return res.end();
  }
  var rid = parseInt(req.body.rid, 10), s = req.body.status;
  if (!rid || !s) {
    return res.end();   //not allow!
  }
  Reg.update({regID: rid}, {$set: {status: s}}, function(err, reg){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (!reg) {
      return res.end();   //not allow!
    }
    if (s == '2') {
      User.watch(reg.user, function(err, user) {
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.end();
        }
        if (!user) {
          return res.end();   //not allow!
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
              OE(err);
              req.session.msg = '系统错误！';
            }
            return res.end();
          });
        };
        if (flg) {
          user.privilege = '70';
          user.save(function(err){
            if (err) {
              OE(err);
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
    req.session.msg = 'You have no permission to do that!';
    return res.end();
  }
  var name = clearSpace(req.body.name);
  if (!name) {
    return res.end();   //not allow
  }
  var cid = parseInt(req.body.cid, 10);
  if (!cid) {
    return res.end();   //not allow
  }
  Contest.watch(cid, function(err, contest){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (!contest) {
      return res.end(); //not allow
    }
    User.watch(name, function(err, user){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      if (!user) {
        req.session.msg = 'The user is not exist.';
        return res.end();
      }
      regContestAndUpdate(cid, name, function(err){
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.end();
        }
        req.session.msg = '添加完成！';
        return res.end();
      });
    });
  });
};

exports.toggleStar = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = 'Please login first!';
    return res.end();
  }
  var cid = parseInt(req.body.cid, 10)
  ,   str = clearSpace(req.body.str)
  ,   type = parseInt(req.body.type, 10);
  if (!cid || !str || !type) {
    return res.end();       //not allow!
  }
  Contest.watch(cid, function(err, con){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (req.session.user.name != con.userName) {
      req.session.msg = 'You have no permission to do that!';
      return res.end();
    }
    if (!con) {
      return res.end();     //not allow!
    }
    var has = {}, names = new Array();
    if (con.contestants) {
      con.contestants.forEach(function(p){
        has[p] = true;
      });
      var tmp = str.split(' ');
      if (tmp) {
        tmp.forEach(function(p){
          if (has[p]) {
            names.push(p);
            has[p] = false;
          }
        });
      }
    }
    User.distinct('name', {name: {$in: names}}, function(err, users){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      var H;
      if (type == 1) H = {$addToSet: {stars: {$each: users}}};
      else H = {$pullAll: {stars: users}};
      Contest.update(cid, H, function(err){
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.end();
        }
        req.session.msg = users.length+'个用户切换打星状态成功！';
        return res.end();
      });
    });
  });
};

exports.topic = function(req, res) {
  if (!req.query.page) {
    page = 1;
  } else {
    page = parseInt(req.query.page, 10);
  }
  if (!page || page < 0) {
    return res.redirect('/topic');
  }
  var search = req.query.search, q1 = {cid: -1}, q2 = {cid: -1};

  if (search) {
    q1.title = q2.user = new RegExp("^.*"+toEscape(search)+".*$", 'i');
  }
  Topic.get({$or:[q1, q2]}, page, function(err, topics, n){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (n < 0) {
      return res.redirect('/topic');
    }
    var names = new Array(), I = {};
    if (topics) {
      topics.forEach(function(p){
        names.push(p.user);
      });
    }
    User.find({name: {$in: names}}, function(err, users){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      if (users) {
        users.forEach(function(p){
          I[p.name] = p.imgType;
        });
      }
      res.render('topic', { title: 'Topic',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            key: 17,
                            topics: topics,
                            page: page,
                            search: search,
                            n: n,
                            I: I,
                            getDate: getTime
      });
    });
  });
};

exports.onetopic = function(req, res) {
  var tid = parseInt(req.params.id, 10);
  if (!tid) {
    return res.end('404');
  }
  Topic.watch(tid, function(err, topic){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.redirect('/');
    }
    if (!topic) {
      return res.end('404');
    }
    Topic.update(tid, {$inc: {browseQty: 1}}, function(err){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      Comment.get({tid: topic.id}, function(err, comments){
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.redirect('/');
        }
        var names = new Array(), has = {}, com = new Array(), sub = {}, N = 0;
        if (comments) {
          N = comments.length;
          comments.forEach(function(p){
            if (!has[p.user]) {
              names.push(p.user);
              has[p.user] = true;
            }
            if (p.fa == -1) {
              com.push(p);
            } else {
              if (!sub[p.fa]) {
                sub[p.fa] = new Array();
              }
              sub[p.fa].push(p);
            }
          });
        }
        if (!has[topic.user]) {
          names.push(topic.user);
        }
        User.find({name: {$in: names}}, function(err, users){
          if (err) {
            OE(err);
            req.session.msg = '系统错误！';
            return res.redirect('/');
          }
          var UT = {}, UC = {}, IT = {};
          if (users) {
            users.forEach(function(p){
              UT[p.name] = UserTitle(p.privilege);
              UC[p.name] = UserCol(p.privilege);
              IT[p.name] = p.imgType;
            });
          }
          res.render('onetopic', {title: 'OneTopic',
                                  user: req.session.user,
                                  message: req.session.msg,
                                  time: (new Date()).getTime(),
                                  key: 18,
                                  topic: topic,
                                  comments: com,
                                  N: N,
                                  sub: sub,
                                  getDate: getTime,
                                  UT: UT,
                                  UC: UC,
                                  IT: IT
          });
        });
      });
    });
  });
};

exports.addtopic = function(req, res) {
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.redirect('/topic');
  }
  var RP = function(T, type) {
    if (T) {
      T.content = escapeHtml(T.content);
    }
    res.render('addtopic', {title: type+'Topic',
                            user: req.session.user,
                            message: req.session.msg,
                            time: (new Date()).getTime(),
                            topic: T,
                            key: 1004
    });
  };
  var tid = parseInt(req.query.tid, 10);
  if (!tid) {
    return RP(null, 'Add');
  } else {
    var user = req.session.user.name;
    Topic.watch(tid, function(err, topic){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.redirect('/');
      }
      if (user != 'admin' && user != topic.user) {
        req.session.msg = '抱歉，您不是该话题的主人，无法进入编辑！';
        return res.redirect('/topic');
      }
      return RP(topic, 'Edit');
    });
  }
};

exports.doAddtopic = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.end();
  }
  var tid = parseInt(req.body.tid, 10)
  ,   title = clearSpace(req.body.title)
  ,   content = req.body.content        //can not do clearSpace because it is content
  ,   name = req.session.user.name
  ,   cid = parseInt(req.body.cid, 10);
  if (!title || !content || !name) {
    return res.end();   //not allow!
  }
  if (!cid) {
    cid = -1;
  }
  if (tid) {
    var RP = function() {
      Topic.update(tid, {$set: {
        title     : title,
        content   : content,
        inDate    : (new Date()).getTime()
      }}, function(err){
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.end();
        }
        req.session.msg = '修改成功！';
        return res.end(tid.toString());
      });
    };
    if (name == 'admin') {
      return RP();
    }
    Topic.watch(tid, function(err, topic){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      if (!topic) {
        return res.end();   //not allow
      }
      if (topic.user != name) {
        req.session.msg = '抱歉，您不是该话题的主人，无权修改！';
        return res.end();
      }
      return RP();
    });
  } else {
    IDs.get('topicID', function(err, id){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      (new Topic({
        id      : id,
        title   : title,
        content : content,
        cid     : cid,
        user    : req.session.user.name,
        inDate  : (new Date()).getTime()
      })).save(function(err){
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.end();
        }
        req.session.msg = '发布成功！';
        return res.end(id.toString());
      });
    });
  }
};

exports.toggleTop = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user || req.session.user.name != 'admin') {
    return res.end();   //not allow!
  }
  var tid = parseInt(req.body.tid, 10);
  if (!tid) {
    return res.end();   //not allow!
  }
  Topic.watch(tid, function(err, topic){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    if (!topic) {
      return res.end(); //not allow!
    }
    topic.top = !topic.top;
    topic.save(function(err){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      req.session.msg = '操作成功！';
      return res.end();
    });
  });
};

exports.review = function(req, res) {
  res.header('Content-Type', 'text/plain');
  if (!req.session.user) {
    req.session.msg = '请先登录！';
    return res.end();
  }
  var user = req.session.user.name
  ,   tid = parseInt(req.body.tid, 10)
  ,   content = req.body.content      //can not do clearSpace because it is content
  ,   fa = parseInt(req.body.fa, 10)
  ,   at = clearSpace(req.body.at);
  if (!user || !tid || !content || !fa) {
    return res.end();     //not allow!
  }
  IDs.get('topicID', function(err, id){
    if (err) {
      OE(err);
      req.session.msg = '系统错误！';
      return res.end();
    }
    (new Comment({
      id      : id,
      content : content,
      user    : user,
      tid     : tid,
      fa      : fa,
      at      : at,
      inDate  : (new Date()).getTime()
    })).save(function(err){
      if (err) {
        OE(err);
        req.session.msg = '系统错误！';
        return res.end();
      }
      Topic.update(tid, {$inc: {reviewsQty: 1}}, function(err){
        if (err) {
          OE(err);
          req.session.msg = '系统错误！';
          return res.end();
        }
        req.session.msg = '回复成功！';
        return res.end(id.toString());
      });
    });
  });
};