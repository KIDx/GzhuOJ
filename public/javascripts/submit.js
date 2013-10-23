var $submit = $('#submit')
,   $err = $('#error');

function U(err) {
    $err.text(err);
    window.location.href = document.URL.split('#')[0]+'#';
}

$(document).ready(function(){
    $submit.click(function(){
        var  code = $('#code').val(), pid = $('#pid').val();
        if (code.length < 50 || code.length > 65536) {
            U('the length of code must be between 50B and 65536B!');
            return false;
        }
        if ($submit.hasClass('disabled')) {
            return false;
        }
        $submit.addClass('disabled');
        $.post('/submit', {
            pid: pid,
            code: code,
            lang: $('#lang').val()
        }, function(res){
            if (res == '3') {
                U('系统错误！');
                $submit.removeClass('disabled');
            } else if (res == '4') {
                U('the problem is not exist!');
                $submit.removeClass('disabled');
            } else {
                window.location.href = '/status';
            }
        });
    });
});