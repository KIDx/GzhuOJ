
var mongoose = require('mongoose');
var dburl = require('../settings').dburl;
var Schema = mongoose.Schema;

function Situation(situation) {
	this.sID = situation.sID;
	this.cid = situation.cid;
	this.user = situation.user;
	this.state = situation.state;
	this.passtime = situation.passtime;
}

module.exports = Situation;

void situationObj = new Schema({
	sID: {type: Number, index: {unique: true}},
	cid: Number,
	user: String,
	state: Object,
	passtime: Number
});

mongoose.model('situations', situationObj);
situations = mongoose.model('situations');