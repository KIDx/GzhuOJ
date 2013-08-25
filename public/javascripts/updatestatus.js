//update status in per 250ms (异步ajax）
var $getstatus = $('table#statustable');
var $manager = $('#con_manager');

function GetStatus (){
    if ($getstatus.find('tr:visible').length == 0) return ;
    
    var $td = $getstatus.find('th:contains(.)');
    if ($td.length == 0) return ;

    var $runid = $td.parent().find('td:eq(0)');
    $runid.each(function(){
        var $This = $(this);
        var rID = $This.text();
        var userName = $This.next().text();
        var $keyTd = $This.next().next().next();
        var tp = $keyTd.text().split('.')[0];
        var manager = '';
        if ($manager.length) manager = $manager.text();
        $.post('/getStatus', {key:rID, manager:manager}, function(doc){
            var solution = doc.split('-'),
                id = parseInt(solution[0]),
                rt = solution[1],
                my = solution[2],
                res = Res(id);
            if (res != tp) {
                var $Img1 = $keyTd.next().find('img').eq(0);
                var $Img2 = $Img1.next();
                $Img1.hide();
                if (res == 'Running') {
                    $Img2.show();
                    $keyTd.html(res+'...');
                } else {
                    $Img2.hide();
                    $keyTd.text(res);
                    var $runTime = $keyTd.next();
                    var x, y;
                    if (rt == 'x') x = '---';
                    else x = rt+' MS';
                    if (my == 'x') y = '---';
                    else y = my+' KB';
                    $runTime.text(x);
                    $runTime.next().text(y);
                    if ($manager.length) {
                        FinalRes[rID] = id;
                        FinalTime[rID] = rt;
                        FinalMemory[rID] = my;
                    }
                }
                $keyTd.removeClass();
                if (id == 8 && (userName == current_user || current_user == 'admin')) {
                    $keyTd.html('<a href="javascript:;" title="more information" rid="'+rID+'" class="CE '+Col(id)+'">'+res+'</a>');
                    BindCE();
                } else {
                    $keyTd.addClass(Col(id));
                }
            }
        });
    });
}

$('document').ready(function() {
    setInterval(GetStatus, 250);
});
