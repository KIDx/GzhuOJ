//for user page
var $usercol = $('span#usercol')
,   pvl = parseInt($usercol.attr('pvl'), 10)
,   name = $usercol.attr('name')
,   tc = 'user-'+UserCol(pvl)
,   title = UserTitle(pvl)
,   str = title.split('-')
,   $pvl = $('#pvl');

$(document).ready(function(){
    $usercol.addClass(tc);
    $usercol.attr('title', title);
    var html = '';
    if (pvl) html = str[0]+' ';
    html += '<a class="user '+tc+'" href="/user/'+name+'" title="'+title+'">'+name+'</a>';
    $usercol.html(html);
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