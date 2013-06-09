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
        case 0: return 'Pending';
        case 1: return 'Running';
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
    if (!n) return 'gray';
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
    if (!n) return 'Not Certified-未认证';
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

var Tag = ['','beginer','brute force','binary search','ternary search','constructive',
'dp','games','geometry','graphs','greedy','hashing','implementation',
'math','matrices','number theory','probabilities','dfs', 'bfs',
'shortest paths','sortings','string suffix structures','strings',
 'combinatorics', 'divide and conquer'];

var ProTil = ['','Easy problem for new ACMer','Brute force','Binary search','Ternary search',
'Constructive algorithms','Dynamic programming',
'Games, Sprague–Grundy theorem','Geometry, computational geometry',
'Graphs','Greedy algorithms','Hashing, hashtables',
'Implementation problems, programming technics, simulation',
'Mathematics including integration, differential equations, etc',
'Matrix multiplication, Cramer\'s rule, systems of linear equations',
'Euler function, GCD, divisibility, etc',
'Probabilities, expected values, statistics, random variables, etc',
'Depth-First-Search','Breadth-First-Search','Shortest paths','Sortings, orderings',
'Suffix arrays, suffix trees, suffix automatas, etc',
'String processing', 'Combinatorics', 'Divide and Conquer'];


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

var $footTime = $('span#timer');

var current_user = $footTime.attr('user');

var current_time;
var contest_type = $footTime.attr('type');
var curren_second = parseInt($footTime.attr('time'));

var $finput = $('input[type="text"], textarea').eq(1);
var $uin_del = $('a#uin_del');

var Msg = $footTime.attr('msg');

var $logindialog = $('div#logindialog');
var $logininput = $logindialog.find('input');
var $loginerror = $logindialog.find('small#login_error');
var $loginsubmit = $logindialog.find('a#login_submit');

var $checklogin = $('a.checklogin, button.checklogin');

var $regdialog = $('div#regdialog');
var $setdialog = $('div#setdialog')

var $logout = $('a#logout');

var $tablebg = $('div.tablebg');

var $sverdict = $('span#verdict');

function buildPager(current_page, pn) {
    var cp = 5, html = '';
    var i = current_page - 2; if (i <= 0) i = 1;

    if (pn > 3) {
        html += '<li id="1"';
        if (current_page <= 3) html += ' class="disabled"';
        html += '><a href="javascript:;">&lt&lt</a></li>';
    }
    if (i > 1) html += '<li class="nothing"><a>...</a></li>';
    while (i < current_page)
    {
        html += '<li id="'+i+'"><a href="javascript:;">'+i+'</a></li>';
        i++;
        --cp;
    }
    html += '<li id="'+i+'" class="active"><a href="javascript:;">'+i+'</a></li>';
    ++i;
    --cp;
    while (i <= pn && cp > 0)
    {
        html += '<li id="'+i+'"><a href="javascript:;">'+i+'</a></li>';
        i++;
        --cp;
    }
    if (i-1 < pn) html += '<li class="nothing"><a>...</a></li>';
    if (pn > 5) {
        html += '<li id="'+pn+'"';
        if (i > pn) html += ' class="disabled"';
        html += '><a href="javascript:;">&gt&gt</a></li>';
    }
    return html;
}

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

//To check cstr is empty or not
function JudgeString(cstr) {
    var d = cstr.split(' ');
    var str = "", flg = false;
    for (var i in d) {
        if (d[i]) {
            if (flg) str += ' ';
            else flg = true;
            str += d[i];
        }
    }
    return str;
}

function trim(str) {
    if (!str) return '';
    return String(str).replace(/(^\s*)|(\s*$)/g, '');
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
    curren_second += 1000;
}

var timeout;
function ShowMessage(msg) {
    $msgdialog = $('div#msg-dialog');
    if ($msgdialog.length > 0) $msgdialog.remove();
    $('div#body').after('<div class="jqmWindow" id="msg-dialog"><span>'+msg+'</span><span class="msgclose jqmClose">×</span></div>');
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
    if ($finput.length) {
        $finput.focus();
        $finput.val($finput.val());
    }

    //绑定清空search输入框内容
    if ($uin_del.length) {
        var $search = $('input#search');
        if ($search.val()) $uin_del.show();
        $search.keyup(function(){
            if ($search.val()) $uin_del.show();
            else $uin_del.hide();
        });
        $uin_del.click(function(){
            $search.val('').keyup();
            $search.focus();
            $uin_del.hide();
        });
    }

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
            if (!$logininput.eq(0).val()) {
                $loginerror.text('the username can not be empty!');
                return ;
            }
            $.post('/doLogin', {
                    username: $logininput.eq(0).val(),
                    password: $logininput.eq(1).val()
                }, function(res){
                    if (res == '1') {
                        $loginerror.text('the user is not exist!');
                        return ;
                    }
                    if (res == '2') {
                        $loginerror.text('username and password do not match!');
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
                    nextURL = '/submit?pID=' + $(this).attr('pid');
                    $logindialog.jqmShow();
                    break;
                }
                window.location.href = '/submit?pID=' + $(this).attr('pid');
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
        var $regerror = $regdialog.find('small#reg_error');

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
                $regerror.text('username can not be empty!');
                return false;
            }
            if (username.length < 2 || username.length > 15) {
                $regerror.text('the length of username must be between 2 and 15!');
                return false;
            }
            var pattern = new RegExp("^[a-zA-Z0-9_]{2,15}$");
            if (!pattern.test(username)) {
                $regerror.text("username should only contain digits, letters, or '_'s!");
                return false;
            }
            var password = $reginput.eq(1).val();
            if (!password) {
                $regerror.text('password can not be empty!');
                return false;
            }
            var repeat = $reginput.eq(2).val();
            if (repeat != password) {
                $regerror.text('two password are not the same!');
                return false;
            }
            var nick = JudgeString($reginput.eq(3).val());
            if (!nick) {
                $regerror.text('nickname can not be empty!');
                return false;
            }
            if (nick.length > 20) {
                $regerror.text('the length of nickname should be no more than 20!');
                return false;
            }
            var email = $reginput.eq(5).val();
            if (email) {
                pattern = new RegExp("^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,4}$");
                if (!pattern.test(email)) {
                    $regerror.text('the format of email is not True!');
                    return false;
                }
            }
            if (!$reginput.eq(6).val()) {
                $regerror.text('验证码不能为空!');
                return false;
            }

            $.post('/getVerifycode', function(verifycode){
                var tp = $reginput.eq(6).val().toLowerCase();
                if (tp != verifycode) {
                    $regerror.text('验证码错误!');
                    return ;
                }
                $.post('/getUsername', {key: username}, function(res){
                    if (res) {
                        $regerror.text('this user already exists!');
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
        var $seterror = $setdialog.find('small#set_error');
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
                $seterror.text('Old Password can not be empty!');
                return false;
            }
            var password = $setinput.eq(1).val();
            var repeat = $setinput.eq(2).val();
            if (repeat != password) {
                $seterror.text('Two New Passwords are not the same!');
                return false;
            }
            if (password == oldpassword) {
                $seterror.text('New Password should not be the same as the old one!');
                return false;
            }
            var nick = JudgeString($setinput.eq(3).val());
            if (!nick) {
                $seterror.text('Nick Name can not be empty!');
                return false;
            }
            if (nick.length > 20) {
                $seterror.text('The length of Nick Name should be no more than 20!');
                return false;
            }
            var email = $setinput.eq(5).val();
            if (email) {
                pattern = new RegExp("^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,4}$");
                if (!pattern.test(email)) {
                    $seterror.text('The format of Email is not True!');
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
                $seterror.text('The Old Password is not True!');
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
