//for the left table
var $table = $('#addcontest tr');
var $addcontestForm = $('#form');

var FormData = {
	type:$addcontestForm.attr('type'),
	cid:$addcontestForm.attr('cid'),
	manager:$addcontestForm.attr('manager')
};

$('document').ready(function() {
	var date = $addcontestForm.attr('date');
	var start = getDate(new Date()).split(' ')[0];
	if (!date) date = start;
	$('input#datepicker').Zebra_DatePicker({
		direction	:[start, 60],
		show_icon	:false,
		offset		:[-20,270]
	}).val(date);
});

//for the right table
//keyup 截流响应
var searchTimeout;

var $right_table = $('table#addproblems');
var $rows = $right_table.find('tr');
//add or delete problem button
var $button = $rows.find('a.adbtn');
//problemID
var $pid = $rows.find('th input:eq(0)');
//Alias
var $alias = $rows.find('th input:eq(1)');

//means how many problems for the contest
//which must be about to be posted to the Server
var k = $right_table.find('tr:visible').length-1;

//Title
var $ptitle = $rows.find('td');
//for $ptitle Set: (from 0 to k-1)
//for $pid and $alias Set: (from 0 to k-1)
//for $rows Set: (from 1 to k)

function CheckTheProblem(pid, $ttl, key){
	if (!pid || pid.length > 5) {
		$ttl.text('No Such Problem!');
		$ttl.removeClass().addClass('error-text');
		return ;
	}
	$.post('/getProblem', {'pid':pid}, function(res){
		if (res) {
			$ttl.text(res);
			$ttl.removeClass().addClass('success-text');
		} else {
			$ttl.text('No Such Problem!');
			$ttl.removeClass().addClass('error-text');
		}
		if (key == 1) {
			var $ta = $ttl.prev().prev().find('input');
			var tp = $ta.attr('alias');
			if (tp && tp != $ttl.text()) {
				$ta.val(tp);
				$ta.removeAttr('alias');
			}
		}
	});
}

$('document').ready(function(){
	$ptitle.eq(0).text('No Such Problem!').addClass('error-text');
	$button.each(function(i){
		$button.eq(i).click(function(){
			if (i == 0) {
				++k;
				$rows.eq(k).show();
				var $oldpid = $pid.eq(k-2), $newpid = $pid.eq(k-1);
				var $ttl = $ptitle.eq(k-1);
				if (k > 1 && $oldpid.val()) {
					$newpid.val( parseInt($oldpid.val())+1 );
				}
				CheckTheProblem($newpid.val(), $ttl, 0);
				if (k == 26) $button.eq(0).hide();
			} else {
				$button.each(function(j){
					if (j >= k) return false;
					if (j < i) return true;
					$pid.eq(j-1).val( $pid.eq(j).val() );
					$alias.eq(j-1).val( $alias.eq(j).val() );
					$ptitle.eq(j-1).text( $ptitle.eq(j).text() )
				});
				$pid.eq(k-1).val('');
				$alias.eq(k-1).val('');
				$rows.eq(k).hide();
				--k;
				if (k == 25) $button.eq(0).show();
			}
		});
	});
});

//to check if it can be submited
var $tr1 = $table.eq(0);
var $tr2 = $table.eq(1);
var $tr3 = $table.eq(2);
var $tr8 = $table.eq(6);

var $title = $tr1.find('input');
var $date = $tr2.find('input');
var $len = $tr3.find('input');

var $info = $tr8.find('td').eq(1);

var $hour = $date.eq(1);
var $minute = $date.eq(2);
var $lday = $len.eq(0);
var $lhour = $len.eq(1);
var $lmin = $len.eq(2);

function CheckDate() {
	var hour = $hour.val();
	var minute = $minute.val();
	if (hour < 0 || hour >= 24 || minute < 0 || minute >= 60) {
		$tr8.addClass('error');
		$info.text('Begin Time Format Error!');
		return false;
	}
	return true;
}

function CheckProblem() {
	var flg = true, hash = {}, sign = false;
	$ptitle.each(function(i){
		if (i >= k) return false;
		if (!$ptitle.eq(i).text() || $ptitle.eq(i).text() == 'No Such Problem!') {
			flg = false;
			$ptitle.eq(i).text('No Such Problem!');
			$ptitle.eq(i).addClass('error-text');
		} else if (flg == true && sign == false) {
			if (!hash[$pid.eq(i).val()])
				hash[$pid.eq(i).val()] = true;
			else sign = true;
		}
	});
	if (flg && sign) {
		$info.text('A problem can\'t be added more than once!');
		return false;
	}
	if (!flg) {
		$info.text('There are invalid problems!');
	}
	return flg;
}

function CheckTitle() {
	var str = JudgeString($title.val());
	if (!str) {
		$tr8.addClass('error');
		$info.text('Contest Title should not be empty!');
		return false;
	}
	$title.val(str);
	return true;
}

function CheckSubmit() {
	if (k === 0) {
		$tr8.addClass('error');
		$info.text('You should add at least one problem!');
		return false;
	}
	if (!CheckProblem()) {
		$tr8.addClass('error');
		return false;
	}
	if (CheckTitle() && CheckDate())
		return true;
	return false;
}

function InputLimit($limit) {
	function run() {
		var tp = $limit.val();
		tp = tp.replace(/[^\d]{1,2}$/g, '');
		$limit.val( tp );
	}
	$limit.keyup(function(){
		run();
	});
	$limit.change(function(){
		run();
		if (!$limit.val()) {
			$limit.val( 0 );
		}
	});
}

$(document).ready(function(){
	$pid.each(function(i){
		var $tpid = $pid.eq(i);
		var $ttl = $ptitle.eq(i);
		CheckTheProblem ($tpid.val(), $ttl, 1);
		$tpid.keyup(function(){
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(function(){
				CheckTheProblem ($tpid.val(), $ttl, 0);
			}, 300);
		});
	});
	$('#addcontestSubmit').click(function(){
		if (!CheckSubmit()) return false;
		FormData.cnt = k;
		FormData.ctitle = $title.val();
		FormData.cdate = $date.eq(0).val();
		FormData.chour = $hour.val(); FormData.cminute = $minute.val();
		FormData.cDay = $lday.val();
		FormData.cHour = $lhour.val(); FormData.cMinute = $lmin.val();
		if (FormData.type == 2) FormData.cpassword = $table.eq(3).find(':checked').val();
		else FormData.cpassword = $table.eq(3).find(':input').val();
		FormData.Description = $table.eq(4).find(':input').val();
		FormData.Announcement = $table.eq(5).find(':input').val();
		FormData.ary = new Array();
		for (var i = 0; i < k; i++) {
			var tmp = JudgeString($alias.eq(i).val());
			if (!tmp) tmp = $ptitle.eq(i).text();
			FormData.ary.push([$pid.eq(i).val(), tmp]);
		}
		$.post('/addcontest', FormData, function(res){
			window.location.href = res;
		});
	});
	InputLimit($hour);
	InputLimit($minute);
	InputLimit($lday);
	InputLimit($lhour);
	InputLimit($lmin);
});