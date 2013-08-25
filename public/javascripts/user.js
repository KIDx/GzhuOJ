//for user page
var $usercol = $('span#usercol');

$(document).ready(function(){
    var pvl = parseInt($usercol.attr('pvl'));
    var tc = 'user-'+UserCol(pvl);
    $usercol.addClass(tc);
    var title = UserTitle(pvl);
    $usercol.attr('title', title);
    var str = title.split('-');
    var tp = '', tname = $usercol.attr('name');
    if (pvl) tp = str[0]+' ';
    tp += '<a class="user '+tc+'" href="/user/'+tname+'" title="'+title+'">'+tname+'</a>';
    $usercol.html(tp);
    var $select = $usercol.next();
    if ($select.length) {
        $select.next().click(function(){
            $.post('/changePvl', {name:tname,pvl:$select.val()}, function(){
                window.location.reload(true);
            });
        });
    }
    var $ap = $('#addprob');
    if ($ap.length) {
        $ap.click(function(){
            $.post('/changeAddprob', {name:tname}, function(){
                window.location.reload(true);
            });
        });
    }
});