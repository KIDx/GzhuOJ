
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
});

mongoose.model('users', userObj);
var users = mongoose.model('users');

User.prototype.save = function save(callback) {
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
      return callback('user insert Error: this user is already exited!');
    }
    return callback(err);
  });
};

User.get = function get(username, callback) {
  users.findOne({name:username}, function(err, doc){
    if (err) {
      return callback('user get Error!', doc);
    }
    return callback(err, doc);
  });
};

User.Find = function Find (key, q, callback) {
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

User.getAll = function getAll(q, n, PageNum, callback) {
  var Q = {$and:[ {$or:[q, {nick:q.name}]}, {$nor:[{name:'admin'}]} ]};
  var sl = {
    _id: 0,
    __v: 0,
    password: 0,
    regTime: 0,
    school: 0,
    email: 0,
    number: 0,
    realname: 0,
    sex: 0,
    college: 0,
    addprob: 0
  };
  users.find(Q).count(function(err, count){
    users.find(Q).select(sl).sort({solved:-1,submit:1,privilege:-1,name:1}).skip((n-1)*PageNum).limit(PageNum).exec(function(err, docs){
      if (err) {
        return callback('user getAll Error!', null, 1);
      }
      return callback(err, docs, count);
    });
  });
};

User.getRank = function getRank(username, callback) {
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

User.update = function update(Q, H, callback) {
  users.update(Q, H, { multi:true }, function(err){
    if (err) {
      console.log('user.update failed');
    }
    return callback(err);
  });
};

User.All = function All(callback) {
  users.find({}, function(err, docs){
    if (err) {
      console.log('user.clear failed');
    }
    return callback(err, docs);
  });
}

User.del = function del() {
  users.find({}, function(err, docs){
    docs.forEach(function(doc) {
        doc.remove();
        console.log('user');
    });
  });
};
