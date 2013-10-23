
var mongoose = require('mongoose')
,   Schema = mongoose.Schema
,   pageNum = require('../settings.js').contestRank_pageNum;

function Rank(id) {
  this._id = id;
};

module.exports = Rank;

var rankObj = new Schema({
  _id: {type: Object, index: {unique: true}},
  value: Object
});

mongoose.model('ranks', rankObj);
var ranks = mongoose.model('ranks');

Rank.prototype.save = function(callback){
  //存入 Mongodb 的文档
  rank = new ranks();
  rank._id = this._id;
  rank.value = {solved:0, penalty:0};
  rank.save(function(err){
    if (err) {
      console.log('the rank is already exited!');
    }
    return callback(err);
  });
};

Rank.findOne = function(Q, callback) {
  ranks.findOne(Q, function(err, doc){
    if (err) {
      console.log('Rank.fineOne failed!');
    }
    return callback(err, doc);
  });
};

Rank.get = function(Q, page, callback){
  ranks.count(Q, function(err, count){
    if ((page-1)*pageNum > count) {
      return callback(null, null, -1);
    }
    ranks.find(Q).sort({'value.solved':-1, 'value.penalty':1, '_id.name':1})
    .skip((page-1)*pageNum).limit(pageNum).exec(function(err, docs) {
      if (err) {
        console.log('Rank.get failed!');
      }
      return callback(err, docs, parseInt((count+pageNum-1)/pageNum, 10));
    });
  });
};

Rank.count = function(Q, callback) {
  ranks.count(Q, function(err, count){
    if (err) {
      console.log('Rank.count failed!');
    }
    return callback(err, count);
  });
};

Rank.update = function(Q, H, callback) {
  ranks.update(Q, H, {multi:true}, function(err){
    if (err) {
      console.log('Rank.update failed!');
    }
    return callback(err);
  });
};

Rank.remove = function(Q, callback) {
  ranks.remove(Q, function(err){
    if (err) {
      console.log('Rank.remove failed!');
    }
    return callback(err);
  });
};

Rank.del = function(){
  ranks.find({}, function(err, docs){
    docs.forEach(function(doc) {
        doc.remove();
        console.log('rank');
    });
  });
};