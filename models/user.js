
var mongoose = require('mongoose')
,   Schema = mongoose.Schema
,   pageNum = require('../settings').ranklist_pageNum;

function User(user) {
  this.name = user.name;
  this.password = user.password;
  this.regTime = user.regTime;
  this.nick = user.nick;
  this.school = user.school;
  this.email = user.email;
  this.signature = user.signature;
}

module.exports = User;

var userObj = new Schema({
  name: {type: String, index: {unique: true}},
  password: String,
  regTime: String,
  nick: String,
  school: String,
  email: String,
  signature: String,

  submit: Number,
  solved: Number,
  privilege: String,

  number: String,
  realname: String,
  sex: String,
  college: String,
  grade: String,
  addprob: Boolean,
  imgType: String
});

mongoose.model('users', userObj);
var users = mongoose.model('users');

User.prototype.save = function(callback){
  //存入 Mongodb 的文档
  user = new users();

  user.name = this.name;
  user.password = this.password;
  user.regTime = this.regTime;
  user.nick = this.nick;
  user.school = this.school;
  user.email = this.email;
  user.signature = this.signature;

  user.submit = 0;
  user.solved = 0;
  addprob = false;
  //user.privilege = 99;

  user.save(function(err){
    if (err) {
      console.log('user insert Error: this user is already exited!');
    }
    return callback(err);
  });
};

User.watch = function(username, callback){
  users.findOne({name:username}, function(err, doc){
    if (err) {
      console.log('User.watch failed!');
    }
    return callback(err, doc);
  });
};

User.find = function(Q, callback){
  users.find(Q, function(err, docs){
    if (err) {
      console.log('User.find failed!');
    }
    return callback(err, docs);
  });
};

User.get = function(Q, page, callback){
  users.find(Q).count(function(err, count){
    if ((page-1)*pageNum > count) {
      return callback(null, null, -1);
    }
    users.find(Q).sort({solved:-1,submit:1,privilege:-1,name:1}).skip((page-1)*pageNum).limit(pageNum).exec(function(err, docs){
      if (err) {
        console.log('User.get Error!');
      }
      return callback(err, docs, parseInt((count+pageNum-1)/pageNum, 10));
    });
  });
};

User.Find = function(key, q, callback){
  users.find(q, function(err, docs){
    if (err) {
      return callback('user Find Error!', null);
    }
    var users = {};
    docs.forEach(function(p){
      if (key == 1) users[p.name] = {pvl:p.privilege,gde:p.grade,name:p.realname};
      else users[p.name] = p.privilege;
    });
    return callback(err, users);
  });
};

User.getRank = function(username, callback){
  users.find({$nor:[{name:'admin'}]}).sort({solved:-1,submit:1,privilege:-1,name:1}).exec(function(err, docs){
    if (err) {
      return callback('user getRank Error!', -1);
    }
    var k = 'null';
    docs.forEach(function(p, i){
      if (p.name == username) {
        k = i + 1;
        return false;
      }
    });
    return callback(err, k);
  });
};

User.update = function update(Q, H, flg, callback) {
  users.update(Q, H, { multi:flg }, function(err){
    if (err) {
      console.log('user.update failed');
    }
    return callback(err);
  });
};

User.del = function del() {
  users.find({}, function(err, docs){
    docs.forEach(function(doc) {
        doc.remove();
        console.log('user');
    });
  });
};