
var mongoose = require('mongoose')
,   Schema = mongoose.Schema;

function IDs (ids){
  this.name = ids.name;
  this.id = ids.id;
}

module.exports = IDs;

var idsObj = new Schema({
  name: {type: String, index: {unique: true}},
  id: Number
});

mongoose.model('idss', idsObj);
var idss = mongoose.model('idss');

IDs.Init = function(){
  var tnames = ['problemID', 'runID', 'contestID', 'regID'];
  for (var i = 0; i < 4; i++) {
    ids = new idss();
    ids.name = tnames[i];
    ids.id = 999;
    ids.save(function(err){
      if (err) console.log(err);
      else console.log('ids init succeed!');
    });
  }
};

IDs.get = function(idname, callback){
  idss.findOneAndUpdate({name: idname}, {$inc:{'id':1}}, function(err, doc) {
    if (err) {
      return callback ('id update Error!', null);
    }
    if (!doc) {
      err = 'You should init the ids first!';
      throw err;
    }
    return callback(err, doc.id);
  });
};

IDs.del = function(){
  idss.find({}, function(err, docs){
    docs.forEach(function(doc) {
        doc.remove();
        console.log('ids');
    });
  });
};