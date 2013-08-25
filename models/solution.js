
var mongoose = require('mongoose')
,   settings = require('../settings')
,   dburl = settings.dburl
,   pageNum = settings.status_pageNum
,   Schema = mongoose.Schema;

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

Solution.connect = function(callback){
  mongoose.connect(dburl);
};

Solution.disconnect = function(callback){
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

Solution.prototype.save = function(callback){
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
      console.log('runID is already exited');
    }
    return callback(err);
  });
};

Solution.find = function(Q, callback){
  solutions.find(Q, function(err, docs){
    if (err) {
      console.log('Solution.find failed!');
    }
    return callback(err, docs);
  });
};

Solution.get = function(Q, page, callback){
  solutions.find(Q).count(function(err, count) {
    if ((page-1)*pageNum > count) {
      return callback(null, null, -1);
    }
    solutions.find(Q).sort({runID:-1}).skip((page-1)*pageNum).limit(pageNum)
    .exec(function(err, docs){
      if (err) {
        console.log('Solution.get failed!');
      }
      return callback(err, docs, parseInt((count+pageNum-1)/pageNum, 10));
    });
  });
};

Solution.distinct = function(key, Q, callback){
  solutions.distinct(key, Q, function(err, docs){
    if (err) {
      console.log('Solution.getdistinct failed!');
    }
    callback(err, docs);
  });
};

Solution.update = function(Q, H, callback){
  solutions.update(Q, H, { multi:true }, function(err){
    if (err) {
      console.log('Solution.update failed!');
    }
    return callback(err);
  });
};

Solution.stats = function(Q, sq, page, callback){
  solutions.find(Q).sort(sq).exec(function(err, docs){
    if (err) {
      console.log('Solution.statis failed!');
    }
    var sols = new Array(), has = {};
    if (docs) {
    }
    return callback(err, docs);
  });
};

Solution.watch = function(Q, callback){
  solutions.findOne(Q, function(err, doc){
    if (err) {
      console.log('Solution.watch failed!');
    }
    return callback(err, doc);
  });
};

Solution.aggregate = function(o, callback){
  solutions.aggregate(o, function(err, docs){
    if (err) {
      console.log('Solution.aggregate failed!');
    }
    return callback(err, docs);
  });
};

Solution.count = function(Q, callback){
  solutions.count(Q, function(err, count){
    if (err) {
      console.log('Solution.count failed!');
    }
    return callback(err, count);
  });
};

Solution.del = function(){
  solutions.find({}, function(err, docs){
    docs.forEach(function(doc) {
        doc.remove();
        console.log('solution');
    });
  });
};