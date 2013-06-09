
var mongoose = require('mongoose');
var dburl = require('../settings').dburl;
var Schema = mongoose.Schema;

function Solution(solution) {
  this.runID = solution.runID;
  this.problemID = solution.problemID;
  this.userName = solution.userName;
  this.inDate = solution.inDate;
  this.language = solution.language;
  this.length = solution.length;
  this.cID = solution.cID;
  this.code = solution.code;
}

module.exports = Solution;

Solution.connect = function (callback) {
  mongoose.connect(dburl);
};

Solution.disconnect = function (callback) {
  mongoose.disconnect(callback);
};

var solutionObj = new Schema({
  runID: {type: Number, index: {unique: true}},
  problemID: Number,
  userName: String,
  inDate: String,
  result: Number,
  language: Number,
  length: Number,
  time: Number,
  memory: Number,
  cID: Number,
  code: String,
  CE: String
});

mongoose.model('solutions', solutionObj);
var solutions = mongoose.model('solutions');

Solution.prototype.save = function save(callback) {
  //存入 Mongodb 的文档
  solution = new solutions();
  solution.runID = this.runID;
  solution.problemID = this.problemID;
  solution.userName = this.userName;
  solution.inDate = this.inDate;
  solution.result = 0;
  solution.language = this.language;
  solution.length = this.length;
  solution.time = 0;
  solution.memory = 0;
  solution.cID = this.cID;
  solution.code = this.code;
  solution.save(function(err){
    if (err) {
      return callback('runID is already exited');
    }
    return callback(null);
  });
};

Solution.get = function get(q, n, mini, PageNum, all, callback) {
  var sl = { code:0, _id:0, __v:0, CE:0 };
  if (all == 0) {
    sl.language = 0; sl.length = 0;
    sl.time = 0; sl.memory = 0;
  }
  if (mini > -1) sl.cID = 0;
  if (n < 0) {
    solutions.find(q).select(sl).where('runID').gt(mini).sort({runID:-1}).exec(function(err, docs){
      if (err) {
        return callback('Solution.get failed!', null, 1);
      }
      return callback(err, docs);
    });
  } else {
    solutions.find(q).count(function(err, count) {
      solutions.find(q).select(sl).sort({runID:-1}).skip((n-1)*PageNum).limit(PageNum).exec(function(err, docs){
        if (err) {
          return callback('Solution.get failed!', null, 1);
        }
        return callback(err, docs, count);
      });
    });
  }
};

Solution.getDistinct = function getDistinct(key, Q, callback) {
  solutions.distinct(key, Q, function(err, docs){
    if (err) {
      return callback('solution.getdistinct failed', null);
    }
    callback(err, docs);
  });
};

Solution.update = function update(Q, H, callback) {
  solutions.update(Q, H, { multi:true }, function(err){
    if (err) {
      console.log('solution.update failed');
    }
    return callback(err);
  });
};

Solution.statis = function statis(pid, sq, callback){
  solutions.find({problemID:pid}).select({
    cID:0,
    code:0,
    problemID:0
  }).where('result').gt(1).sort(sq).exec(function(err, docs){
    if (err) {
      return callback('solution.statis failed', null);
    }
    return callback(err, docs);
  });
};

Solution.FindOut = function FindOut(Q, callback) {
  solutions.find(Q).exec(function(err, docs){
    if (err) {
      return callback('solution.findout failed', null);
    }
    var probs = {};
    docs.forEach(function(p){
      if (probs[p.problemID] != '2') {
        if (p.result == 2) probs[p.problemID] = '2';
        else probs[p.problemID] = '1';
      }
    });
    return callback(err, probs);
  });
};

Solution.Find = function Find(name, callback) {
  solutions.find({userName:name}).select({
    runID:0,
    userName: 0,
    inDate: 0,
    language: 0,
    length: 0,
    time: 0,
    memory: 0,
    cID: 0,
    code: 0,
    CE: 0
  }).where('result').gt(1).exec(function(err, docs){
    if (err) {
      return callback('solution.find failed', null);
    }
    return callback(err, docs);
  });
};

Solution.watch = function watch(Q, callback) {
  solutions.findOne(Q, function(err, doc){
    if (err) {
      return callback(err, null);
    }
    return callback(err, doc);
  });
};

Solution.Count = function Count(Q, callback) {
  solutions.find(Q).count(function(err, count){
    if (err) {
      console.log('solution.count failed');
    }
    return callback(err, count);
  });
};

Solution.Clear = function Clear(callback) {
  solutions.find({}, function(err, docs){
    if (err) {
      console.log(err);
    }
    callback(docs);
  });
};

Solution.del = function del() {
  solutions.find({}, function(err, docs){
    docs.forEach(function(doc) {
        doc.remove();
        console.log('solution');
    });
  });
};