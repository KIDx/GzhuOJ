
//截流响应
var interceptorTime = 300;

var $contest = $('#contest')
,	status = parseInt($contest.attr('status'), 10)
,	pending = $contest.attr('pending')
,	TotalTime = parseInt($contest.attr('len'), 10)*60
,	cid = $contest.attr('cid')
,	passTime = -pending;

var $progress = $('#progress')
,	$bar = $progress.children('div.bar')
,	$info = $('#contest-info')
,	$lefttime = $('#lefttime');

var $div = $('#thumbnail');

function buildPager(page, n) {
    var cp = 5, html = '<ul>';
    var i = page - 2; if (i <= 0) i = 1;

    html += '<li id="1"';
    if (page == 1) html += ' class="disabled"';
    html += '><a href="javascript:;">&lt&lt</a></li>';
    if (i > 1) {
    	html += '<li class="disabled"><a>...</a></li>';
    }
    while (i < page)
    {
        html += '<li id="'+i+'"><a href="javascript:;">'+i+'</a></li>';
		++i; --cp;
    }
    html += '<li class="active"><a href="javascript:;">'+i+'</a></li>';
    while (i < n && cp > 1)
    {
    	++i; --cp;
        html += '<li id="'+i+'"><a href="javascript:;">'+i+'</a></li>';
    }
    if (i < n) html += '<li class="disabled"><a>...</a></li>';
    html += '<li id="'+n+'"';
    if (n == 0 || page == n) html += ' class="disabled"';
    html += '><a href="javascript:;">&gt&gt</a></li></ul>';
    return html;
}

var $status = $div.find('#statustab')
,	$list = $('#list')
,	$tablebg = $('div.tablebg')
,	$tbody = $tablebg.find('#statustable tbody')
,	$search = $('#search')
,	$pid = $('#pid')
,	$result = $('#result')
,	$Filter = $('#fil')
,	$plink
,	statusQ = { cid:cid, page:1 }
,	searchTimeout
,	Users = {};

function bindstatusQ() {
	var $af = $('a[res]');
	$af.unbind();
	$af.click(function(){
		$pid.val(F.charAt($(this).attr('pid')));
		$result.val($(this).attr('res'));
		$tablink.eq(2).click();
	});
}

function buildRow(sol) {
	var html = '<tr class="';
	if (cnt % 2 == 1) html += 'odd';
	else html += 'even';
	++cnt;
	if (sol.userName == current_user) html += ' highlight';
	html += '">';

	html += '<td>'+sol.runID+'</td>';
	var pvl;
	if (contest_type == 2 && contest_private)
		pvl = parseInt(Users[sol.userName].pvl);
	else pvl = parseInt(Users[sol.userName]);
	html += '<td><a href="/user/'+sol.userName+'" class="user user-';
	html += UserCol(pvl)+'" title="'+UserTitle(pvl)+'">'+sol.userName+'</a></td>';
	//html += '<td><a href="#problem/'+pmap[sol.problemID]+'">'+pmap[sol.problemID]+'</a></td>';
	html += '<td><a class="plink" href="#problem-'+pmap[sol.problemID]+'">'+pmap[sol.problemID]+'</a></td>';

	html += '<th';
	if (sol.result == 8 && (sol.userName == current_user || current_user == 'admin')) {
		html += '><a href="javascript:;" rid="'+sol.runID+'" class="CE '+Col(sol.result)+'">'+Res(sol.result)+'</a>';
	} else {
		html += ' class="'+Col(sol.result)+'">'+Res(sol.result);
	}
	html += '</th>';

	var tpstr;
	if (sol.result == 0) {
		tpstr = '<img src="/img/pending.gif" width="16px" height="16px"/>';
	} else if (sol.result == 1) {
		tpstr = '<img src="/img/running.gif" width="16px" height="16px"/>';
	} else if (parseInt(sol.time, 10) >= 0) {
		tpstr = sol.time+' MS';
	} else {
		tpstr = '---';
	}
	html += '<td>'+tpstr+'</td>';

	if (parseInt(sol.memory, 10) >= 0) {
		tpstr = sol.memory+' KB';
	} else {
		tpstr = '---';
	}
	html += '<td>'+tpstr+'</td>';

	var lang = sol.language, str = 'C';
	if (lang == 2) str = 'C++';
	else if (lang == 3) str = 'Java';
	
	html += '<td><a target="_blank" href="/sourcecode/'+sol.runID+'">'+str+'</a></td>'

	if (parseInt(sol.length, 10) >= 0) {
		tpstr = sol.length+' B';
	} else {
		tpstr = '---';
	}
	html += '<td>'+tpstr+'</td>';
	html += '<td>'+sol.inDate+'</td>';
	html += '</tr>';
	return html;
}

function Response(json) {
	if (!json) return ;
	var pvl = json.pop(), n = json.pop(), sols = json.pop();
	$.each(pvl, function(i, p){
		if (!Users[i])
			Users[i] = p;
	});
	$list.html(buildPager(statusQ.page, n));
	var html;
	if (!sols || sols.length == 0) {
		html = '<tr class="odd"><td class="error-text center" colspan="9">No Status are matched.</td></tr>';
	} else {
		cnt = 1;
		html = $.map(sols, buildRow).join('');
	}
	if ($plink && $plink.length) {
		$plink.unbind();
	}
	$tbody.html( html );
	$plink = $('a.plink');
	$plink.click(function(){
		$tablink.eq(1).attr('href', $(this).attr('href'));
		$tablink.eq(1).click();
	});
	BindCE();
	$status.fadeIn(100);
}

function GetStatus() {
	searchTimeout = setTimeout(function(){
		var ts = JudgeString($search.val()), tp = $pid.val(), tr = $result.val();
		if (tp == '-1') tp = '';
		else tp = fmap[tp];
		statusQ.name = ts;
		statusQ.pid = tp;
		statusQ.result = tr;
		clearTimeout(searchTimeout);
		$.ajax({
			type: 'POST',
			url: '/getStatus',
			dataType: 'json',
			data: statusQ,
			timeout: 5000
		})
		.done(Response);
	}, interceptorTime);
}

//pmap[pid]='A, B, C...', fmap['A, B, C...'] = pid
var pmap = {}, fmap = {};

function index(pid) {
	return pmap[pid].charCodeAt(0)-65;
}

var $hid = $('div.hidden, li.hidden')
,	$tablink = $div.find('a[data-toggle="tab"]')
,	WATCH = 0;

//overview
var $overview = $div.find('#overviewtab')
,	$o_index = $overview.find('td.o_index')
,	$o_sol = $overview.find('td.o_sol')
,	$pidtext = $('span.cpid')
,	$clone = $('#clone')
,	prob_num = $pidtext.length
,	overviewTimeout;


function OverviewResponse(json) {
	if (!json) return ;
	var sols = json.pop(), All = json.pop();
	if (sols) {
		$.each(sols, function(i, p){
			var $oi = $o_index.eq(index(p._id));
			if (p.result == 2) {
				$oi.addClass('AC');
				$oi.next().next().addClass('AC-fill');
			} else {
				$oi.addClass('WA');
				$oi.next().next().addClass('WA-fill');
			}
		});
	}

	var ac = {}, all = {};
	if (All) {
		for (var id in All) {
			var p = All[id], i = index(p._id.pid);
			if (!all[i]) all[i] = 0;
			all[i] += p.val;
			if (p._id.result == 2) {
				if (!ac[i]) ac[i] = 0;
				ac[i] += p.val;
			}
		}
	}

	for (var i = 0; i < prob_num; i++) {
		if (!ac[i]) ac[i] = 0;
		if (!all[i]) all[i] = 0;
		var $oi = $o_sol.eq(i)
		,	_ac = '<a href="javascript:;" res="2" pid="'+i+'">'+ac[i]+'</a>'
		,	_all = '<a href="javascript:;" res="-1" pid="'+i+'">'+all[i]+'</a>';
		$oi.html(_ac+'&nbsp/&nbsp'+_all);
	}

	if ($clone.length) {
		$clone.unbind();
		$clone.click(function(){
			if ($logindialog.length > 0) {
				nextURL = '/addcontest?cID=-'+document.URL.split('?cID=')[1]+'&type=1';
				$logindialog.jqmShow();
			} else {
				window.location.href = '/addcontest?cID=-'+cid+'&type=1';
			}
		});
	}
	bindstatusQ();
}

function GetOverview() {
	clearTimeout(overviewTimeout);
	overviewTimeout = setTimeout(function(){
		$.ajax({
			type 		: 'POST',
			url 		: '/getOverview',
			dataType 	: 'json',
			data 		: {cid: cid},
			timeout 	: 5000
		})
		.done(OverviewResponse);
		$overview.fadeIn(100);
	}, interceptorTime);
}

//problem
//标记之前浏览页是否为problem页
var PreTab = 0;

var $problem = $div.find('#problemtab')
,	$probcontain = $problem.children('#prob-contain')
,	$problemlink = $problem.find("li.problemlink")
,	$title = $problem.find('h3#problem_title > span')
,	$limit = $problem.find('font.limit')
,	$link = $('a.splink')
,	F = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
,	ID, problemTimeout
,	ProblemAPI = {};

var $content = $('#content');

var S = ['Problem Description', 'Input', 'Output', 'Sample Input', 'Sample Output', 'Hint', 'Source']
,	$probsubmit = $('#probsubmit')
,	$rejudge = $('#rejudge');

function ProblemsResponse(prob) {
	if (!ProblemAPI[ID]) ProblemAPI[ID] = prob;
	$title.eq(0).text( F.charAt(ID) );
	$title.eq(1).text( $pidtext.eq(ID).text() );
	$limit.eq(0).text( 2*prob.timeLimit+'/'+prob.timeLimit );
	$limit.eq(1).text( 2*prob.memoryLimit+'/'+prob.memoryLimit );
	if (prob.spj === 1) {
		$limit.eq(2).html('&nbsp;&nbsp;&nbsp;&nbsp; Special Judge');
	} else {
		$limit.eq(2).html('');
	}
	var q = [prob.description, prob.input, prob.output, prob.sampleInput,
	prob.sampleOutput, prob.hint];
	$content.html('');
	for (i = 0; i < 7; i++) {
		if (!q[i]) continue;
		var tcon = '<h4>'+S[i]+'</h4><div class="accordion-inner">';
		if (i === 3 || i === 4) {
			tcon += '<pre class="sample">'+q[i]+'</pre>';
		} else {
			tcon += q[i];
		}
		tcon += '</div>';
		$content.append(tcon);
	}
	$problemlink.each(function() {
		$(this).removeClass('active');
	});
	$problemlink.eq(ID).addClass('active');

	//增加题号,题目属性
	$probsubmit.attr('pid', pid_index);
	$probsubmit.next().attr('pid', ID);
	$probsubmit.attr('tname', pid_name);
	if ($rejudge.length) {
		$rejudge.unbind();
		$rejudge.click(function(){
			$.post('/rejudge', {pid:pid_index, cid:'1'}, function(res){
				$pid.val(F.charAt(ID));
				if (res == '0') ShowMessage('Failed! You have no permission to Rejudge.');
				else if (res == '1') ShowMessage('Problem '+F.charAt(ID)+' has been Rejudged successfully!');
				$tablink.eq(2).click();
			});
		});
	}
	if (PreTab == 1) $probcontain.fadeIn(200);
	else $problem.fadeIn(200);
	PreTab = 1;
}

function GetProblem() {
	setTimeout(function(){
		if (!ID || ID < 0) ID = 0;
		pid_index = $pidtext.eq(ID).attr('id');
		pid_name = $pidtext.eq(ID).text();
		if (ProblemAPI[ID]) {
			ProblemsResponse(ProblemAPI[ID]);
		} else {
			$.ajax({
				type: 'POST',
				url: '/getProblem',
				dataType: 'json',
				data: {
					curl: 'problem/'+F.charAt(ID),
					cid: cid,
					pid: pid_index,
					all: true
				},
				timeout: 5000
			})
			.done(ProblemsResponse);
		}
	}, interceptorTime);
}

var $rank = $div.find('#ranktab');

function run(str, key) {
	if (!str) str = '#overview'
	window.location.hash = str;
	var sp = str.split('-');
	var a = sp[0], b = sp[1], c = sp[2], d = sp[3];
	ID = 0;
	switch(a) {
		case '#problem': {
			if (WATCH == 0) break;
			if (b) ID = b.charCodeAt(0)-65;
			if (key == 1) {
				$overview.hide();
				$tablink.eq(1).parent().addClass('active');
				$problem.addClass('active');
			}
			if (PreTab == 1) $probcontain.hide();
			else $problem.hide();
			GetProblem();
			break;
		}
		case '#status': {
			if (WATCH == 0) break;
			if (key == 1) {
				$overview.hide();
				$tablink.eq(2).parent().addClass('active');
				$status.addClass('active');
			}
			$status.hide();
			//if (b) statusQ.page = parseInt(b, 10);
			//if (c) $pid = 
			GetStatus();
			PreTab = 0;
			break;
		}
		case '#rank': {
			if (WATCH == 0) break;
			if (key == 1) {
				$overview.hide();
				$tablink.eq(3).parent().addClass('active');
				$rank.addClass('active');
			}
			$rank.hide();
			//GetContestRanklist();
			PreTab = 0;
			break;
		}
		default: {
			if (key == 1) {
				$tablink.eq(0).parent().addClass('active');
				$overview.addClass('active');
			}
			$overview.hide();
			if (key == 1 && WATCH == 0) {
				$overview.fadeIn(100);
				PreTab = -1;
			} else {
				GetOverview();
				PreTab = 0;
			}
			break;
		}
	}
}

function pendingTimer() {
	var left = deal(pending);
	var infoleft = '-'+left;
	if (infoleft != $info.text()) {
		$info.text(infoleft);
	}
	if ($lefttime.length) {
		if (left != $lefttime.text()) $lefttime.text(left);
	}
	--pending;
	if (pending < 0) {
		window.location.reload(true);
	}
}

function runningTimer() {
	if (passTime > TotalTime) {
		window.location.reload(true);
	} else {
		var tp = passTime*100.0/TotalTime;
		if (tp > 50) $contain.css({'text-align':'left'});
		$bar.css({width:tp+'%'});
		$info.css({width:(100<=tp+2.5)?'100%':tp+2.5+'%'});
		$info.text('-'+deal(TotalTime - passTime));
		++passTime;
	}
}

function runContest() {
	//bulid map pmap and fmap
	$.each($pidtext, function(i) {
		var tpid = $(this).attr('id'), tch = F.charAt(i);
		pmap[tpid] = tch;
		fmap[tch] = tpid;
	});

	$link.click(function(){
		if ($(this).parent().hasClass('active')) {
			return false;
		}
		$tablink.eq(1).attr('href', $(this).attr('href'));
		$tablink.eq(1).click();
		run($(this).attr('href'), 2);
	});

	$tablink.on('show', function(e){
		//e.target;			// activated tab
		//e.relatedTarget	// previous tab
		var href;
		if (e.relatedTarget) {
			href = $(e.relatedTarget).attr('href').split('-')[0];
		}
		switch(href) {
			case '#problem': {
				$problem.hide();
				break;
			}
			case '#status': {
				$status.hide();
				break;
			}
			case '#rank': {
				$rank.hide();
				break;
			}
			default: {
				$overview.hide();
				break;
			}
		}
		href = $(e.target).attr('href');
		run(href, 2);
	});

	if (status > 0 || $contest.attr('watch')) {
		WATCH = 1;
		$hid.removeClass('hidden');
		run(window.location.hash, 1);
	} else {
		run('#overview', 1);
	}
}

$(document).ready(function(){
	if (status == 0) {
		pendingTimer();
		setInterval(pendingTimer, 1000);
	} else if (status == 1) {
		runningTimer();
		setInterval(runningTimer, 1000);
	}
	runContest();
});

$(document).ready(function(){
	$Filter.click(function(){
		GetStatus();
	});
	$('#reset').click(function(){
		$search.val(''); $pid.val(-1); $result.val(-1);
		GetStatus();
	});
	$search.keyup(function(e){
		if (e.keyCode == 13) {
			$Filter.click();
		}
	});
	bindstatusQ();
});