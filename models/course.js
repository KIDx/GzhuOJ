
var mongoose = require('mongoose')
,   Schema = mongoose.Schema
,   pageNum = require('../settings').course_pageNum;

function Course(course) {
  this.courseID = course.courseID;
  this.title = course.title;
  this.probs = course.probs;
};

module.exports = Course;

var courseObj = new Schema({
  courseID: {type: Number, index: {unique: true}},
  title: String,
  probs: Array
});

mongoose.model('courses', courseObj);
var courses = mongoose.model('courses');

Course.prototype.save = function(callback){
  course = new courses();
  course.courseID = this.courseID;
  course.title = this.title;
  course.probs = this.probs;
  course.save(function(err){
    if (err) {
      console.log('the course is already exited!');
    }
    return callback(err);
  });
};

Course.get = function(Q, page, callback){
  courses.count(Q, function(err, count){
    if ((page-1)*pageNum > count) {
      return callback(null, null, -1);
    }
    courses.find(Q).sort({courseID:-1}).skip((page-1)*pageNum).limit(pageNum).find(function(err, docs){
      if (err) {
        console.log('Courses.get failed');
      }
      return callback(err, docs, parseInt((count+pageNum-1)/pageNum, 10), count);
    });
  });
};

Course.watch = function(cid, callback){
  courses.findOne({courseID:cid}, function(err, doc){
    if (err) {
      console.log('Course.watch failed!');
    }
    return callback(err, doc);
  });
};

Course.findOneAndUpdate = function(Q, H, O, callback){
  courses.findOneAndUpdate(Q, H, O, function(err, doc){
    if (err) {
      console.log('Course.findOneAndUpdate failed!');
    }
    return callback(err, doc);
  });
};

Course.update = function(cid, H, callback){
  courses.update({courseID:cid}, H, function(err){
    if (err) {
      console.log('Course.update failed!');
    }
    return callback(err);
  });
};

Course.dele = function(Q, callback){
  courses.findOneAndRemove(Q, function(err){
    if (err) {
      console.log('Course.dele failed');
    }
    return callback(err);
  });
};

Course.del = function() {
  courses.find({}, function(err, docs){
    docs.forEach(function(doc) {
        doc.remove();
        console.log('course');
    });
  });
};