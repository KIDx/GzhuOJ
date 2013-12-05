
var mongoose = require('mongoose')
,   Schema = mongoose.Schema
,   settings = require('../settings')
,   OE = settings.outputErr;

function Group(group) {
  this.id = group.id;
};

module.exports = Group;

var groupObj = new Schema({
  id: {type: Number, index: {unique: true}},
  name: String,
  pids: Array
});

mongoose.model('groups', groupObj);
var groups = mongoose.model('groups');

Group.prototype.save = function(callback){
  group = new groups();
  group.id = this.id;
  group.name = '新的分组';
  group.pids = new Array();
  group.save(function(err){
    if (err) {
      OE('Group.save failed!');
    }
    return callback(err);
  });
};

Group.watch = function(gid, callback){
  groups.findOne({id:gid}, function(err, doc){
    if (err) {
      OE('Group.watch failed!');
    }
    return callback(err, doc);
  });
};

Group.update = function(gid, H, callback){
  groups.update({id:gid}, H, function(err){
    if (err) {
      OE('Group.update failed!');
    }
    return callback(err);
  });
};