
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

Reg.prototype.save = function save(callback) {
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
      return callback('reg insert Error!');
    }
    return callback(err);
  });
};

Reg.get = function get(Q, n, PageNum, callback) {
  var sl = {_id:0, __v:0};
  regs.find(Q).count(function(err, count){
    regs.find(Q).select(sl).sort({regTime: -1}).skip((n-1)*PageNum).limit(PageNum).exec(function(err, docs){
      if (err) {
        return callback('Reg Get Error!', null, 1);
      }
      return callback(err, docs, count);
    });
  });
}

Reg.Find = function Find(cid, name, callback) {
  if (!name) return callback(null, 0);
  regs.findOne({cid:cid, user:name}, function(err, doc){
    if (err) {
      return callback('Reg Find Error!', null);
    }
    return callback(err, doc);
  });
}

Reg.update = function update(rid, s, callback) {
  regs.update({regID:rid}, {$set:{status:s}}, function(err) {
    if (err) {
      return callback('Reg update Error!');
    }
    return callback(err);
  });
};

Reg.del = function del() {
  regs.find({}, function(err, docs){
    docs.forEach(function(doc) {
        doc.remove();
        console.log('reg');
    });
  });
};