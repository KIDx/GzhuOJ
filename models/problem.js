
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function Problem(problem) {
  this.problemID = problem.problemID;
  this.title = problem.title;
  this.description = problem.description;
  this.input = problem.input;
  this.output = problem.output;
  this.sampleInput = problem.sampleInput;
  this.sampleOutput = problem.sampleOutput;
  this.hint = problem.hint;
  this.source = problem.source;
  this.spj = problem.spj;
  this.timeLimit = problem.timeLimit;
  this.memoryLimit = problem.memoryLimit;
  this.hide = problem.hide;
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
  manager: String
});

mongoose.model('problems', problemObj);
var problems = mongoose.model('problems');

Problem.prototype.save = function save(key, callback) {
  if (key == 2) {
    //存入 Mongodb 的文档
    problem = new problems();
    problem.problemID = this.problemID;
    problem.title = this.title;
    problem.description = this.description;
    problem.input = this.input;
    problem.output = this.output;
    problem.sampleInput = this.sampleInput;
    problem.sampleOutput = this.sampleOutput;
    problem.hint = this.hint;
    problem.source = this.source;
    problem.spj = this.spj;
    problem.AC = 0;
    problem.submit = 0;
    problem.timeLimit = this.timeLimit;
    problem.memoryLimit = this.memoryLimit;
    if (!this.hide) problem.hide = false;
    else problem.hide = true;
    if (this.manager) problem.manager = this.manager;
    problem.tags = new Array();

    problem.save(function(err){
      if (err) {
        return callback('the problem is already exited');
      }
      return callback(null);
    });
  } else {
    problems.update({problemID:this.problemID}, {$set:{
      title       : this.title,
      description : this.description,
      input       : this.input,
      output      : this.output,
      sampleInput : this.sampleInput,
      sampleOutput: this.sampleOutput,
      hint        : this.hint,
      source      : this.source,
      spj         : this.spj,
      timeLimit   : this.timeLimit,
      memoryLimit : this.memoryLimit,
      hide        : this.hide
    }}, function(err){
      if (err) {
        return callback('problem update failed');
      }
      return callback(null);
    });
  }
};

Problem.get = function get(q, sq, n, PageNum, callback) {
  var Q = q;
  var sl = {
    _id: 0,
    __v: 0,
    description: 0,
    input: 0,
    output: 0,
    sampleInput: 0,
    sampleOutput: 0,
    hint: 0,
    spj: 0,
    timeLimit: 0,
    memoryLimit: 0,
    hide: 0,
    manager: 0
  };
  problems.find(Q).count(function(err, count){
    problems.find(Q).select(sl).sort(sq).skip((n-1)*PageNum).limit(PageNum).find(function(err, docs){
      if (err) {
        return callback('Problems matched failed', null, 1);
      }
      return callback(err, docs, count);
    });
  });
};

Problem.watch = function watch(pID, callback) {
  problems.findOne({problemID: pID}, function(err, doc) {
    if (err) {
      return callback('problem watch failed', null);
    }
    if (doc) {
      return callback(err, doc);
    }
    return callback('The problem '+pID+' is not exist!', null);
  });
};

Problem.update = function update(pID, Q, callback) {
  problems.update({problemID: pID}, Q, function(err){
    if (err) {
      console.log('user.update failed');
    }
    return callback(err);
  });
};

Problem.change = function change() {
  problems.find({}, function(err, docs){
    docs.forEach(function(doc, i) {
      doc.tags = new Array();
      doc.save(function(){
        console.log('problem change succeed!');
      });
    });
  });
};

Problem.del = function del() {
  problems.find({}, function(err, docs){
    docs.forEach(function(doc, i) {
      doc.remove();
      console.log('problem delete succeed!');
    });
  });
};