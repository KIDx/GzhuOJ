var $submit = $('#submit')
,   $err = $('#error');

function U(err) {
    $err.text(err);
    window.location.href = document.URL.split('#')[0]+'#';
}

$(document).ready(function(){
    $submit.click(function(){
        if ($submit.hasClass('disabled')) {
            return false;
        }
        var  code = String($('#code').val()), pid = $('#pid').val(), lang = $('#lang').val();
        if (code.length < 50 || code.length > 65536) {
            U('the length of code must be between 50B and 65536B!');
            return false;
        }
        $submit.text('Submitting...').addClass('disabled');
        $.ajax({
            type : 'POST',
            url : '/submit',
            data : {
                pid: pid,
                code: code,
                lang: lang
            },
            dataType : 'text',
            error: function() {
                $submit.text('Submit').removeClass('disabled');
                U('无法连接到服务器！');
            }
        })
        .done(function(res){
            if (!res) {
                window.location.href = '/status';
                return ;
            } else if (res == '3') {
                U('系统错误！');
            } else if (res == '4') {
                U('The problem is not exist!');
            }
            $submit.text('Submit').removeClass('disabled');
        });
    });
});