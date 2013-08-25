
var mongoose = require('mongoose')
,   Schema = mongoose.Schema
,   pageNum = require('../settings').contest_pageNum;

function Contest(contest) {
  this.title = contest.title;
  this.startTime = contest.startTime;
  this.len = contest.len;
  this.description = contest.description;
  this.msg = contest.msg;
  this.password = contest.password;
};

module.exports = Contest;

var contestObj = new Schema({
  contestID: {type: Number, index: {unique: true}},
  userName: String,
  title: String,
  startTime: String,
  len: Number,
  description: String,
  msg: String,
  probs: Array,
  password: String,
  type: Number,
  contestants: Array
});

mongoose.model('contests', contestObj);
var contests = mongoose.model('contests');

Contest.prototype.save = function(callback){
  contest = new contests();
  contest.contestID = this.contestID;
  contest.userName = this.userName;
  contest.title = this.title;
  contest.startTime = this.startTime;
  contest.len = this.len;
  contest.description = this.description;
  contest.msg = this.msg;
  contest.probs = this.probs.slice(0);
  contest.password = this.password;
  contest.type = this.type;
  contest.save(function(err){
    if (err) {
      console.log('the contest is already exited!');
    }
    return callback(err);
  });
};

Contest.get = function(Q, page, callback){
  contests.find(Q).count(function(err, count){
    if ((page-1)*pageNum > count) {
      return callback(null, null, -1);
    }
    contests.find(Q).sort({startTime:-1}).skip((page-1)*pageNum).limit(pageNum).find(function(err, docs){
      if (err) {
        console.log('Contests.get failed');
      }
      return callback(err, docs, parseInt((count+pageNum-1)/pageNum, 10));
    });
  });
};

Contest.watch = function(cID, callback){
  contests.findOne({contestID:cID}, function(err, doc){
    if (err) {
      console.log('Contest.watch failed!');
    }
    return callback(err, doc);
  });
};

Contest.update = function(cID, q, callback){
  contests.findOneAndUpdate({contestID:cID}, q, function(err){
    if (err) {
      console.log('Contest.update failed!');
      return callback();
    }
    callback(err);
  });
};

Contest.dele = function(Q, callback){
  contests.findOne(Q, function(err, doc){
    if (err) {
      console.log('Contest.dele failed');
    }
    if (doc) doc.remove();
    return callback(err);
  });
};

Contest.del = function() {
  contests.find({}, function(err, docs){
    docs.forEach(function(doc) {
        doc.remove();
        console.log('contest');
    });
  });
};