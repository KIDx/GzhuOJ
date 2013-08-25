/*
*
*   Global Variable
*
*/

//return status color class
function Col (n) {
    switch(n) {
        case 0:
        case 1: return 'info-text';
        case 2: return 'success-text';
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 9:
        case 10:
        case 11:
        case 12:
        case 15: return 'error-text';
        default: return 'special-text';
    }
}

//return status result string
function Res (n) {
    switch(n) {
        case 0: return 'Pending...';
        case 1: return 'Running...';
        case 2: return 'Accepted';
        case 3: return 'Presentation Error';
        case 4: return 'Time Limit Exceeded';
        case 5: return 'Memory Limit Exceeded';
        case 6: return 'Wrong Answer';
        case 7: return 'Output Limit Exceeded';
        case 8: return 'Compilation Error';
        case 13: return 'Dangerous Code';
        case 14: return 'System Error';
        default: return 'Runtime Error';
    }
}

//return user color style
function UserCol (n) {
    if (!n) return 'black';
    switch(n) {
        case 73:
        case 99: return 'red';
        case 82: return 'orange';
        case 81: return 'violet';
        case 72: return 'blue';
        case 71: return 'cyan';
        case 70: return 'green';
    }
}

//return user title
function UserTitle (n) {
    if (!n) return 'Normal-普通用户';
    switch(n) {
        case 99: return 'Administrator-创界者';
        case 82: return 'Teacher-老师';
        case 81: return 'Captain-队长';
        case 73: return 'Visitant-贵宾';
        case 72: return 'Expert-资深队员';
        case 71: return 'Specialist-普通队员';
        case 70: return 'Student-本校学生';
    }
}

function errAnimate($err, err) {
    $err.text(err);
    $err.stop().stop().animate({
        'margin-left' : '30px'
    }).animate({
        'margin-left' : '0'
    });
}

function simulateClick($input, $btn) {
    $input.keyup(function(e){
        if (e.keyCode == 13) {
            $btn.click();
        }
    });
}

var CE = {};
var $CE;

//show Compilation Error information
function BindCE() {
    var $infodialog = $('div#infodialog');
    var $text = $infodialog.find('#text');
    if ($CE && $CE.length) {
        $CE.unbind();
    }
    $CE = $('a.CE');
    if ($CE.length) {
        $CE.click(function(){
            $infodialog.jqm({
                overlay: 30,
                trigger: false,
                modal: false,
                closeClass: 'infoclose',
                onShow: function(h) {
                    h.o.fadeIn(200);
                    h.w.fadeIn(200);
                },
                onHide: function(h) {
                    h.w.fadeOut(200);
                    h.o.fadeOut(200);
                }
            }).jqDrag('.jqDrag').jqResize('.jqResize').jqmShow();
            var rid = $(this).attr('rid');
            if (CE[rid]) {
                $text.text(CE[rid]);
                return false;
            }
            $.ajax({
                type: 'POST',
                url: '/getCE',
                data: {rid: rid}
            })
            .always(function(){
                $text.html('<img src="/img/loading.gif">');
            })
            .done(function(res){
                CE[rid] = res;
                $text.text(res);
            });
        });
    }
}

var nextURL = "";

var $footTime = $('span#timer')
,   $contest_current = $('#contest_current');

var current_user = $footTime.attr('user');

var current_time;
var contest_type = $footTime.attr('type');
var curren_second = parseInt($footTime.attr('time'));

var $finput = $('input[type="text"], textarea').eq(1);

var Msg = $footTime.attr('msg');

var $logindialog = $('div#logindialog');
var $logininput = $logindialog.find('input');
var $loginerr = $logindialog.find('small#login_error');
var $loginsubmit = $logindialog.find('a#login_submit');

var $checklogin = $('a.checklogin, button.checklogin');

var $regdialog = $('div#regdialog');
var $setdialog = $('div#setdialog')

var $logout = $('a#logout');

var $tablebg = $('div.tablebg');

var $sverdict = $('span#verdict');

function calTime(startTime, endTime) {
    startTime = startTime.replace(/-/g, '/');
    endTime = endTime.replace(/-/g, '/');
    var st = new Date(startTime), et = new Date(endTime);
    var res = (et.getTime()-st.getTime())/1000;
    return parseInt(res);
}

function deal(times) {
    var h = parseInt(times/3600);
    if (h < 10) h = '0' + h;
    var m = parseInt(times%3600/60);
    if (m < 10) m = '0' + m;
    var key = arguments[1] ? arguments[1] : 0;
    if (key == 1) return (h+':'+m);     //onecontest.js-standings
    var s = parseInt(times%3600%60);
    if (s < 10) s = '0' + s;
    var res;
    if (h >= 48) {
        var day = parseInt(h/24+0.5);
        if (day >= 14) res = parseInt(day/7+0.5)+' weeks';
        else res = day+' days';
    } else res = h+':'+m+':'+s;
    return res;
}

function CheckEscape(ch) {
  if (ch == '$' || ch == '(' || ch == ')' || ch == '*' || ch == '+' ||
      ch == '.' || ch == '[' || ch == ']' || ch == '?' || ch == '\\' ||
      ch == '^' || ch == '^' || ch == '{' || ch == '}' || ch == '|')
    return true;
  return false;
}

function toEscape(str) {
  var res = '';
  for (var i = 0; i < str.length; i++) {
    if (CheckEscape(str.charAt(i))) res += '\\';
    res += str.charAt(i);
  }
  return res;
}

function trim(s) {
    if (!s) return '';
    return String(s).replace(/(^\s*)|(\s*$)/g, '');
}

function drim(s) {
    if (!s) return '';
    return String(s).replace(/(\s+)/g, ' ');
}

//return a string without no unuseful space
function JudgeString(s) {
    return drim(trim(s));
}

function getDate(date) {
  var Y = date.getFullYear();
  var M = date.getMonth()+1;
  if (M < 10) M = '0' + M;
  var D = date.getDate();
  if (D < 10) D = '0' + D;
  var h = date.getHours();
  if (h < 10) h = '0' + h;
  var m = date.getMinutes();
  if (m < 10) m = '0' + m;
  return (Y+'-'+M+'-'+D+' '+h+':'+m);
}

function calDate(startTime, len) {
  var str = startTime.split(' ');
  var date = str[0].split('-');
  var time = str[1].split(':');
  var Y = date[0], M = date[1], D = date[2];
  var h = time[0], m = time[1];
  var newdate = new Date();
  newdate.setFullYear(Y); newdate.setMonth(M-1); newdate.setDate(D);
  newdate.setHours(h); newdate.setMinutes(m); newdate.setSeconds(0); newdate.setMilliseconds(0);
  newdate.setTime(newdate.getTime() + len*60000);
  return getDate(newdate);
}

function SetCurrentTime() {
    var date = new Date();
    date.setTime(curren_second);
    current_time = getDate(date);
    var s = date.getSeconds();
    if (s < 10) s = '0' + s;
    current_time += ':' + s;
    $footTime.text(current_time);
    if ($contest_current.length) {
        $contest_current.text(current_time);
    }
    curren_second += 1000;
}

var timeout;
function ShowMessage(msg) {
    $msgdialog = $('div#msg-dialog');
    if ($msgdialog.length > 0) $msgdialog.remove();
    $('#wrapper').append('<div class="jqmWindow" id="msg-dialog"><span>'+msg+'</span><span class="msgclose jqmClose">×</span></div>');
    $msgdialog = $('div#msg-dialog');
    function Hide() {
        $msgdialog.jqmHide();
    }
    $msgdialog.jqm({
        overlay: 0,
        closeClass: 'msgclose',
        trigger: false,
        onHide: function(h){
            h.w.fadeOut(888);
        },
        onShow: function(h){
            h.w.fadeIn(888, function(){timeout=setTimeout(Hide, 10000);});
        }
    });
    clearTimeout(timeout);
    $msgdialog.jqmShow();
}

$(document).ready(function(){
    if ($tablebg.length > 0) {
        $tablebg.prepend('<div class="lt"></div><div class="rt"></div><div class="lb"></div><div class="rb"></div>');
        $tablebg.find('div#tablediv').prepend('<div class="ilt"></div><div class="irt"></div>');
    }
    $('div.alert').slideDown();

    SetCurrentTime();
    setInterval(SetCurrentTime, 1000);

    //message
    if (Msg) {
        $.post('/msgClear', function(){
            ShowMessage(Msg);
        });
    }

    //focus
    /*if ($finput.length) {
        $finput.focus();
        $finput.val($finput.val());
    }*/

    //login
    if ($logindialog.length) {

        $logindialog.jqm({
            overlay: 30,
            trigger: false,
            modal: true,
            closeClass: 'loginclose',
            onShow: function(h) {
                h.o.fadeIn(200);
                h.w.fadeIn(200);
            },
            onHide: function(h) {
                h.w.fadeOut(200);
                h.o.fadeOut(200);
            }
        }).jqDrag('.jqDrag').jqResize('.jqResize');
        $('a#login').click(function(){
            nextURL='';
            $logindialog.jqmShow();
        });

        $loginsubmit.click(function(){
            var name = $logininput.eq(0).val();
            if (!name) {
                errAnimate($loginerr, 'the username can not be empty!');
                return ;
            }
            var psw = $logininput.eq(1).val();
            if (!psw) {
                errAnimate($loginerr, 'the password can not be empty!');
                return ;
            }
            $.post('/doLogin', {
                    username: name,
                    password: psw
                }, function(res){
                    if (res == '1') {
                        errAnimate($loginerr, 'the user is not exist!');
                        return ;
                    }
                    if (res == '2') {
                        errAnimate($loginerr, 'username and password do not match!');
                        return ;
                    }
                    $logindialog.jqmHide();
                    if (!nextURL) {
                        window.location.reload(true);
                    } else {
                        window.location.href = nextURL;
                        nextURL = '';
                    }
            });
        });

        $logininput.keyup(function(e){
            if (e.keyCode == 13) {
                $loginsubmit.click();
            }
            return false;
        });
    }

    //logout
    if ($logout.length > 0) {
        $logout.click(function(){
            $.post('/logout', function(){
                window.location.reload(true);
            });
        });
    }

    //checklogin
    $checklogin.click(function(){
        var aid = $(this).attr('id');
        switch(aid) {
            case 'gotosubmit': {
                if ($logindialog.length > 0) {
                    nextURL = '/submit?pid=' + $(this).attr('pid');
                    $logindialog.jqmShow();
                    break;
                }
                window.location.href = '/submit?pid=' + $(this).attr('pid');
                break;
            }
            case 'addcontest': {
                if ($logindialog.length > 0) {
                    nextURL = '/addcontest?type='+contest_type;
                    $logindialog.jqmShow();
                    break;
                } else if (contest_type == 2 && current_user != 'admin') {
                    ShowMessage('You have no privilege to add VIP Contest!');
                    break;
                }
                window.location.href = '/addcontest?type='+contest_type;
                break;
            }
            case 'codesubmit': {
                $sform = $('form#scode');
                $code_error_text = $sform.find('span#error');
                var code = $sform.find('textarea#code').attr('value');
                if (code.length < 50 || code.length > 65536) {
                    $code_error_text.text('the length of code must be between 50B and 65536B!');
                    window.location.href = document.URL.split('#')[0]+'#';
                    return ;
                }
                var pid = $sform.find('input#pid').val();
                $.post('/getProblem', {pid: pid}, function(res){
                    if (res) {
                        $.post('/submit', {
                            pid: pid,
                            code: code,
                            lang: $sform.find('select').val()
                        }, function(){
                            window.location.href = '/status';
                        });
                        return ;
                    }
                    $code_error_text.text('the problem is not exist!');
                    window.location.href = document.URL.split('#')[0]+'#';
                });
                break;
            }
        }
    });

    //register
    if ($regdialog.length > 0) {
        var $vcode = $regdialog.find('a#getvcode');
        var $regimg = $regdialog.find('div#vcode');
        var $reginput = $regdialog.find('input');
        var $regsubmit = $regdialog.find('a#reg_submit');
        var $regerr = $regdialog.find('small#reg_error');

        $('a#reg').click(function(){
            $regdialog.jqm({
                overlay: 30,
                trigger: false,
                modal: true,
                closeClass: 'regclose',
                onShow: function(h) {
                    h.o.fadeIn(200);
                    h.w.fadeIn(200);
                },
                onHide: function(h) {
                    h.w.fadeOut(200);
                    h.o.fadeOut(200);
                }
            }).jqDrag('.jqDrag').jqResize('.jqResize').jqmShow();
            $.post('/createVerifycode', function(res){
                $regimg.html(res);
            });
        });

        $vcode.click(function(){
            $.post('/createVerifycode', function(res){
                $regimg.html(res);
            });
        });

        $regsubmit.click(function(){
            var username = $reginput.eq(0).val();
            if (!username) {
                errAnimate($regerr, 'username can not be empty!');
                return false;
            }
            if (username.length < 2 || username.length > 15) {
                errAnimate($regerr, 'the length of username must be between 2 and 15!');
                return false;
            }
            var pattern = new RegExp("^[a-zA-Z0-9_]{2,15}$");
            if (!pattern.test(username)) {
                errAnimate($regerr, "username should only contain digits, letters, or '_'s!");
                return false;
            }
            var password = $reginput.eq(1).val();
            if (!password || password.length < 4) {
                errAnimate($regerr, 'the length of password can not less then 4!');
                return false;
            }
            var repeat = $reginput.eq(2).val();
            if (repeat != password) {
                errAnimate($regerr, 'two password are not the same!');
                return false;
            }
            var nick = JudgeString($reginput.eq(3).val());
            if (!nick) {
                errAnimate($regerr, 'nickname can not be empty!');
                return false;
            }
            if (nick.length > 20) {
                errAnimate($regerr, 'the length of nickname should be no more than 20!');
                return false;
            }
            var email = $reginput.eq(5).val();
            if (email) {
                pattern = new RegExp("^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,4}$");
                if (!pattern.test(email)) {
                    errAnimate($regerr, 'the format of email is not True!');
                    return false;
                }
            }
            if (!$reginput.eq(6).val()) {
                errAnimate($regerr, '验证码不能为空!');
                return false;
            }

            $.post('/getVerifycode', function(verifycode){
                var tp = $reginput.eq(6).val().toLowerCase();
                if (tp != verifycode) {
                    errAnimate($regerr, '验证码错误!');
                    return ;
                }
                $.post('/getUsername', {key: username}, function(res){
                    if (res) {
                        errAnimate($regerr, 'this user already exists!');
                        return ;
                    }
                    $.post('/doReg', {
                        username: username,
                        password: password,
                        nick: nick,
                        school: $reginput.eq(4).val(),
                        email: email,
                        signature: $regdialog.find('textarea').attr('value')
                    }, function(){
                        window.location.reload(true);
                    });
                });
            });
        });

        $reginput.keyup(function(e){
            if (e.keyCode == 13) {
                $regsubmit.click();
            }
            return false;
        });
    }
    //settings
    if ($setdialog.length > 0) {
        var $setinput = $setdialog.find('input');
        var $seterr = $setdialog.find('small#set_error');
        var $setsubmit = $setdialog.find('#set_submit');

        $setdialog.jqm({
            overlay: 30,
            trigger: $('a#set'),
            modal: true,
            closeClass: 'setclose',
            onShow: function(h) {
                h.o.fadeIn(200);
                h.w.fadeIn(200);
            },
            onHide: function(h) {
                h.w.fadeOut(200);
                h.o.fadeOut(200);
            }
        }).jqDrag('.jqDrag').jqResize('.jqResize');

        $setsubmit.click(function(){
            var oldpassword = $setinput.eq(0).val();
            if (!oldpassword) {
                errAnimate($seterr, 'Old Password can not be empty!');
                return false;
            }
            var password = $setinput.eq(1).val();
            var repeat = $setinput.eq(2).val();
            if (repeat != password) {
                errAnimate($seterr, 'Two New Passwords are not the same!');
                return false;
            }
            if (password == oldpassword) {
                errAnimate($seterr, 'New Password should not be the same as the old one!');
                return false;
            }
            var nick = JudgeString($setinput.eq(3).val());
            if (!nick) {
                errAnimate($seterr, 'Nick Name can not be empty!');
                return false;
            }
            if (nick.length > 20) {
                errAnimate($seterr, 'The length of Nick Name should be no more than 20!');
                return false;
            }
            var email = $setinput.eq(5).val();
            if (email) {
                pattern = new RegExp("^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,4}$");
                if (!pattern.test(email)) {
                    errAnimate($seterr, 'The format of Email is not True!');
                    return false;
                }
            }
            $.post('/changeInfo', {
                name: $setdialog.attr('name'),
                oldpassword: oldpassword,
                password: password,
                nick: nick,
                school: $setinput.eq(4).val(),
                email: email,
                signature: $setdialog.find('textarea').attr('value')
            }, function(res){
                if (res == 'F') {
                    window.location.reload(true);
                    return ;
                }
                errAnimate($seterr, 'The Old Password is not True!');
            });
        });

        $setinput.keyup(function(e){
            if (e.keyCode == 13) {
                $setsubmit.click();
            }
            return false;
        });
    }

    //sourcecode
    if ($sverdict.length > 0) {
        $sverdict.after(Res(parseInt($sverdict.attr('res'))));
        $sverdict.remove();
    }
});

var $Go = $('a#Go');
var $Goinput = $Go.prev();

$(document).ready(function(){
    $Go.click(function(){
        window.location.href = '/problem?pID='+$Goinput.val();
    });
    $Goinput.keyup(function(e){
        if (e.keyCode == 13) {
            window.location.href = '/problem?pID='+$Goinput.val();
        }
        return false;
    });
});