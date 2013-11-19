
var mongoose = require('mongoose')
,   Schema = mongoose.Schema
,   settings = require('../settings')
,   pageNum = settings.comment_pageNum
,   OE = settings.outputErr;

function Comment(comment) {
  this.id = comment.id;
  this.content = comment.content;
  this.user = comment.user;
  this.tid = comment.tid;
  this.fa = comment.fa;
  this.at = comment.at;
  this.inDate = comment.inDate;
};

module.exports = Comment;

var commentObj = new Schema({
  id: {type: Number, index: {unique: true}},
  content: String,
  user: String,
  tid: Number,
  fa: Number,
  at: String,
  inDate: Number,
  hide: Boolean
});

mongoose.model('comments', commentObj);
var comments = mongoose.model('comments');

Comment.prototype.save = function(callback){
  comment = new comments();
  comment.id = this.id;
  comment.content = this.content;
  comment.user = this.user;
  comment.tid = this.tid;
  comment.fa = this.fa;
  comment.at = this.at;
  comment.inDate = this.inDate;
  comment.hide = false;
  comment.save(function(err){
    if (err) {
      OE('Comment.save failed!');
    }
    return callback(err);
  });
};

Comment.get = function(Q, callback){
  comments.count(Q, function(err, count){
    comments.find(Q).sort({id: 1}).exec(function(err, docs){
      if (err) {
        OE('Comment.get failed!');
      }
      return callback(err, docs);
    });
  });
};

Comment.watch = function(tid, callback){
  comments.findOne({id:tid}, function(err, doc){
    if (err) {
      OE('Comment.watch failed!');
    }
    return callback(err, doc);
  });
};

Comment.update = function(tid, H, callback){
  comments.update({id:tid}, H, function(err){
    if (err) {
      OE('Comment.update failed!');
    }
    return callback(err);
  });
};

Comment.dele = function(Q, callback){
  comments.findOneAndRemove(Q, function(err){
    if (err) {
      OE('Comment.dele failed');
    }
    return callback(err);
  });
};