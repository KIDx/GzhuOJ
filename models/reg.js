
var mongoose = require('mongoose')
,   Schema = mongoose.Schema
,   settings = require('../settings')
,   pageNum = settings.regform_pageNum
,   OE = settings.outputErr;

function Reg(reg) {
  this.regID = reg.regID;
  this.cid = reg.cid;
  this.user = reg.user;
  this.regTime = reg.regTime;
  this.number = reg.number;
  this.realname = reg.realname;
  this.sex = reg.sex;
  this.college = reg.college;
  this.grade = reg.grade;
}

module.exports = Reg;

var regObj = new Schema({
  regID: {type: Number, index: {unique: true}},
  cid: Number,
  user: String,
  regTime: String,
  number: String,
  realname: String,
  sex: String,
  college: String,
  grade: String,
  status: String
});

mongoose.model('regs', regObj);
var regs = mongoose.model('regs');

Reg.prototype.save = function(callback){
  reg = new regs();
  reg.regID = this.regID;
  reg.cid = this.cid;
  reg.user = this.user;
  reg.regTime = this.regTime;
  reg.number = this.number;
  reg.realname = this.realname;
  reg.sex = this.sex;
  reg.college = this.college;
  reg.grade = this.grade;
  reg.status = '0';
  reg.save(function(err){
    if (err) {
      OE('Reg.save failed!');
    }
    return callback(err);
  });
};

Reg.get = function(Q, page, callback){
  regs.count(Q, function(err, count){
    if ((page-1)*pageNum > count) {
      return callback(null, null, -1);
    }
    regs.find(Q).sort({regTime: -1}).skip((page-1)*pageNum).limit(pageNum).exec(function(err, docs){
      if (err) {
        OE('Reg.get failed!');
      }
      return callback(err, docs, parseInt((count+pageNum-1)/pageNum, 10));
    });
  });
};

Reg.findOne = function(Q, callback){
  regs.findOne(Q, function(err, doc){
    if (err) {
      OE('Reg.findOne failed!');
    }
    return callback(err, doc);
  });
};

Reg.update = function(Q, H, callback){
  regs.findOneAndUpdate(Q, H, function(err, doc) {
    if (err) {
      OE('Reg.update failed!');
    }
    return callback(err, doc);
  });
};