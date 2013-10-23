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
                console.log(res);
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
                grade       : '',
            }, function(){
                window.location.reload(true);
            });
        });
    }
});