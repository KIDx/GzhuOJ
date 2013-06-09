var Canvas = require('canvas');

var getRandom = function(start,end){
    return start+Math.random()*(end-start);
};

exports.Can = function (callback) {
    var canvas = new Canvas(100, 30),
        ctx = canvas.getContext('2d'),
        items = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPRSTUVWXYZ23456789'.split(''),
        vcode = '',
        textColors = ['#FD0', '#6c0', '#09F', '#f30', '#aaa', '#3cc', '#cc0', '#A020F0', '#FFA500', '#A52A2A', '#8B6914', '#FFC0CB', '#90EE90'];

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 90, 35);
    ctx.font = 'bold 30px sans-serif';
    ctx.globalAlpha = .8;
    for (var i = 0; i < 4; i++) {
        var rnd = Math.random();
        var item = Math.round(rnd * (items.length - 1));
        var color = Math.round(rnd * (textColors.length - 1));
        ctx.fillStyle = textColors[color];
        ctx.fillText(items[item], 5 + i*23, 25);
        var a = getRandom (0.85, 0.95);
        var b = getRandom (-0.05, 0.05);
        var c = getRandom (-0.108, 0.108);
        var d = getRandom (0.85, 1.0);
        ctx.transform(a, b, c, d, 0, 0);
        vcode += items[item];
    }
    return callback(vcode.toLowerCase(), '<img src="'+canvas.toDataURL()+'" style="padding-left:30px;" alt="验证码"/>');
};