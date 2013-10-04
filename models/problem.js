
var mongoose = require('mongoose')
,   Schema = mongoose.Schema
,   pageNum = require('../settings').problemset_pageNum;

function Problem(problem) {
  this.problemID = problem.problemID;
  this.manager = problem.manager;
}

module.exports = Problem;

var problemObj = new Schema({
  problemID: {type: Number, index: {unique: true}},
  title: String,
  description: String,
  input: String,
  output: String,
  sampleInput: String,
  sampleOutput: String,
  hint: String,
  source: String,
  spj: Number,
  AC: Number,
  submit: Number,
  timeLimit: Number,
  memoryLimit: Number,
  hide: Boolean,
  tags: Array,
  manager: String,
  TC: Boolean
});

mongoose.model('problems', problemObj);
var problems = mongoose.model('problems');

Problem.prototype.save = function(callback){
  //存入 Mongodb 的文档
  problem = new problems();
  problem.problemID = this.problemID;
  problem.title = 'NULL';
  problem.description = '';
  problem.input = '';
  problem.output = '';
  problem.sampleInput = '';
  problem.sampleOutput = '';
  problem.hint = '';
  problem.source = '';
  problem.spj = 0;
  problem.AC = 0;
  problem.submit = 0;
  problem.timeLimit = 1000;
  problem.memoryLimit = 64000;
  problem.hide = false;
  problem.TC = false;
  if (this.manager) problem.manager = this.manager;
  problem.tags = new Array();

  problem.save(function(err){
    if (err) {
      console.log('the problem is already exited!');
    }
    return callback(err);
  });
};

Problem.find = function(Q, callback) {
  problems.find(Q, function(err, docs){
    if (err) {
      console.log('Problem.find Error!');
    }
    return callback(err, docs);
  });
};

Problem.get = function(Q, page, callback){
  problems.count(Q, function(err, count){
    if ((page-1)*pageNum > count) {
      return callback(null, null, -1);
    }
    problems.find(Q).sort({problemID:1}).skip((page-1)*pageNum).limit(pageNum).find(function(err, docs){
      if (err) {
        console.log('Problem.get failed!');
      }
      return callback(err, docs, parseInt((count+pageNum-1)/pageNum, 10), count);
    });
  });
};

Problem.watch = function(pID, callback){
  problems.findOne({problemID: pID}, function(err, doc) {
    if (err) {
      console.log('Problem.watch failed!');
    }
    return callback(err, doc);
  });
};

Problem.update = function(pID, Q, callback){
  problems.update({problemID: pID}, Q, function(err){
    if (err) {
      console.log('Problem.update failed!');
    }
    return callback(err);
  });
};

Problem.del = function(){
  problems.find({}, function(err, docs){
    docs.forEach(function(doc, i) {
      doc.remove();
      console.log('problem delete succeed!');
    });
  });
};