//for user page
var name = $('#user').attr('name')
,   $pvl = $('#pvl');

$(document).ready(function(){
    if ($pvl.length) {
        $('#submit').click(function(){
            $.post('/changePvl', {
                name        : name,
                pvl         : $pvl.val(),
                realname    : $('#realname').val(),
                sex         : $('#sex').val(),
                college     : $('#college').val(),
                grade         : $('#grade').val()
            }, function(){
                window.location.reload(true);
            });
        });
    }
});

var $ap = $('#addprob');

$(document).ready(function(){
    if ($ap.length) {
        $ap.click(function(){
            if ($(this).hasClass('disabled')) {
                return false;
            }
            $(this).addClass('disabled');
            $.post('/changeAddprob', {name:name}, function(){
                window.location.reload(true);
            });
        });
    }
});

var $recal = $('#recal');

$(document).ready(function(){
    if ($recal.length) {
        $recal.click(function(){
            if ($(this).hasClass('disabled')) {
                return false;
            }
            $(this).text('处理中...');
            $(this).addClass('disabled');
            $.post('/recal', function(res){
                window.location.href = '/ranklist';
            });
        });
    }
});

var $clear = $('#clear');

$(document).ready(function(){
    if ($clear.length) {
        $clear.click(function(){
            if ($(this).hasClass('disabled')) {
                return false;
            }
            $(this).addClass('disabled');
            $.post('/changePvl', {
                name        : name,
                pvl         : '',
                realname    : '',
                sex         : '',
                college     : '',
                grade       : ''
            }, function(){
                window.location.reload(true);
            });
        });
    }
});

var $setdialog = $('div#setdialog');

$(document).ready(function(){
    //settings
    if ($setdialog.length > 0) {
        var $setinput = $setdialog.find('input')
        ,   $seterr = $setdialog.find('small#set_error')
        ,   $setsubmit = $setdialog.find('#set_submit');

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
            var school = JudgeString($setinput.eq(4).val());
            if (school.length > 50) {
                errAnimate($seterr, 'the length of school should be no more than 50!');
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
            if (email.length > 50) {
                errAnimate($seterr, 'the length of email should be no more than 50!');
                return false;
            }
            var signature = JudgeString($setdialog.find('textarea').attr('value'));
            if (signature.length > 200) {
                errAnimate($seterr, 'the length of signature should be no more than 200!');
                return false;
            }
            $.post('/changeInfo', {
                name: $setdialog.attr('name'),
                oldpassword: oldpassword,
                password: password,
                nick: nick,
                school: school,
                email: email,
                signature: signature
            }, function(res){
                if (res) {
                    errAnimate($seterr, 'The Old Password is not True!');
                } else {
                    window.location.reload(true);
                }
            });
        });

        $setinput.keyup(function(e){
            if (e.keyCode == 13) {
                $setsubmit.click();
            }
            return false;
        });
    }
});