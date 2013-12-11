var $div = $('#thumbnail');

//deal with overflow rank table
$(document).ready(function(){
    $div.width($('#xbody').width());
});

//截流响应
var interceptorTime = 300
,	cnt;	//行号

var $contest = $('#contest')
,	$p_span = $('span.cpid')
,	pids = new Array()
,	alias = new Array()
,	ctype = parseInt($contest.attr('ctype'), 10)
,	pageNum = $contest.attr('pageNum')
,	display = $contest.attr('display')
,	contest_private = $contest.attr('psw')
,	startTime = parseInt($contest.attr('startTime'), 10)
,	status = parseInt($contest.attr('status'), 10)
,	pending = $contest.attr('pending')
,	TotalTime = parseInt($contest.attr('len'), 10)*60
,	cid = $contest.attr('cid')
,	passTime = -pending;

var $progress = $('#progress')
,	$bar = $progress.children('div.bar')
,	$info = $('#contest-info')
,	$contain = $('#info-contain')
,	$lefttime = $('#lefttime');

function buildPager(page, n) {
    var cp = 5, html = '<ul>';
    var i = page - 2; if (i <= 0) i = 1;

    html += '<li id="1"';
    if (page == 1) html += ' class="disabled"';
    html += '><a href="javascript:;">&lt&lt</a></li>';
    if (i > 1) {
    	html += '<li class="disabled"><a href="javascript:;">...</a></li>';
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
    if (i < n) html += '<li class="disabled"><a href="javascript:;">...</a></li>';
    html += '<li id="'+n+'"';
    if (n == 0 || page == n) html += ' class="disabled"';
    html += '><a href="javascript:;">&gt&gt</a></li></ul>';
    return html;
}

var $status = $div.find('#statustab')
,	$list = $('#list')
,	$list_a
,	$tablebg = $('div.tablebg')
,	$tbody = $tablebg.find('#statustable tbody')
,	$search = $('#search')
,	$pid = $('#pid')
,	$result = $('#result')
,	$Filter = $('#fil')
,	$plink
,	statusQ = { cid:cid, page:1 }
,	searchTimeout
,	Users
,	statusAjax;

function bindstatusQ() {
	var $af = $('a[res]');
	$af.unbind('click');
	$af.click(function(){
		$pid.val(F.charAt($(this).attr('pid')));
		$result.val($(this).attr('res'));
		$tablink.eq(2).click();
	});
}

function lang(s) {
	if (s == 1) return 'C';
	if (s == 2) return 'C++';
	if (s == 3) return 'Java';
	if (s == 4) return 'C++11';
	return 'unknow';
}

function buildRow(sol) {
	var html = '<tr class="';
	if (cnt % 2 == 1) html += 'odd';
	else html += 'even';
	++cnt;
	if (sol.userName == current_user) html += ' highlight';
	html += '">';

	html += '<td>'+sol.runID+'</td>';
	var pvl = parseInt(Users[sol.userName], 10);
	html += '<td><a target="_blank" href="/user/'+sol.userName+'" class="user user-';
	html += UserCol(pvl)+'" title="'+UserTitle(pvl)+'">'+sol.userName+'</a></td>';
	html += '<td><a class="plink" href="#problem-'+pmap[sol.problemID]+'">'+pmap[sol.problemID]+'</a></td>';

	html += '<td rid="'+sol.runID+'"';
	if (sol.result == 8 && (sol.userName == current_user || current_user == 'admin')) {
		html += ' class="bold"><a href="javascript:;" rid="'+sol.runID+'" class="CE special-text">Compilation Error</a>';
	} else {
		html += ' class="bold '+Col(sol.result);
		if (sol.result == 0) html += ' unknow';
		html += '">'+Res(sol.result);
	}
	html += '</td>';

	var tpstr, tmp = '<span class="user user-gray">---</span>';
	if (sol.result == 0) {
		tpstr = '<img src="/img/pending.gif" width="16px" height="16px"/>';
	} else if (sol.result == 1) {
		tpstr = '<img src="/img/running.gif" width="16px" height="16px"/>';
	} else if (parseInt(sol.time, 10) >= 0) {
		tpstr = sol.time+' MS';
	} else {
		tpstr = tmp;
	}
	html += '<td>'+tpstr+'</td>';

	if (parseInt(sol.memory, 10) >= 0) {
		tpstr = sol.memory+' KB';
	} else {
		tpstr = tmp;
	}
	html += '<td>'+tpstr+'</td>';
	html += '<td><a target="_blank" href="/sourcecode/'+sol.runID+'">'+lang(sol.language)+'</a></td>'

	if (parseInt(sol.length, 10)) {
		tpstr = sol.length+' B';
	} else {
		tpstr = tmp;
	}
	html += '<td>'+tpstr+'</td>';
	html += '<td>'+sol.inDate+'</td>';
	html += '</tr>';
	return html;
}

function Response(json) {
	if (!statusAjax || !json || !isActive(2)) return ;
	Users = json.pop();
	var n = json.pop(), sols = json.pop();
	$list.html(buildPager(statusQ.page, n));
	var html;
	if (!sols || sols.length == 0) {
		html = '<tr class="odd"><td class="error-text center" colspan="9">No Status are matched.</td></tr>';
	} else {
		cnt = 1;
		html = $.map(sols, buildRow).join('');
	}
	if ($list_a && $list_a.length) {
		$list_a.unbind('click');
	}
	if ($plink && $plink.length) {
		$plink.unbind('click');
	}
	$tbody.html( html );
	$list_a = $list.find('a');
	$list_a.click(function(){
		if ($(this).parent().hasClass('active') || $(this).parent().hasClass('disabled'))
			return false;
		statusQ.page = $(this).parent().attr('id');
		GetStatus();
	});
	$plink = $('a.plink');
	$plink.click(function(){
		$tablink.eq(1).attr('href', $(this).attr('href'));
		$tablink.eq(1).click();
	});
	BindCE();
	$status.fadeIn(100, function(){
		clearTimeout(updateInterval);
		updateInterval = setInterval(getStatus, A);
	});
}

function GetStatus() {
	clearTimeout(searchTimeout);
	searchTimeout = setTimeout(function(){
		var ts = JudgeString($search.val()), tp = $pid.val(), tr = $result.val()
		,	hash = '#status-' + ts + '-' + tp + '-' + tr;
		if (statusQ.page) hash += '-' + statusQ.page;
		window.location.hash = hash;
		if (tp == 'nil') tp = '';
		else tp = fmap[tp];
		if (tr == 'nil') tr = '';
		statusQ.name = ts;
		statusQ.pid = tp;
		statusQ.result = tr;
		statusAjax = $.ajax({
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
,	$tablink = $div.find('a.tablink')
,	WATCH = 0;

function isActive(i) {
	return $tablink.eq(i).parent().hasClass('active');
}

function doActive(i) {
	$tablink.eq(i).parent().addClass('active');
}

function noActive(i) {
	$tablink.eq(i).parent().removeClass('active');
}

//overview
var $overview = $div.find('#overviewtab')
,	$o_index = $overview.find('td.o_index')
,	$o_sol = $overview.find('td.o_sol')
,	$clone = $('#clone')
,	prob_num = $p_span.length
,	overviewTimeout
,	overviewAjax;

function OverviewResponse(json) {
	if (!overviewAjax || !json || !isActive(0)) return ;
	var sols = json.pop(), res = json.pop();
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

	if (res) {
		$.each(res, function(i, p){
			var $oi = $o_sol.eq(pmap[p._id].charCodeAt(0)-65), idx = index(p._id)
			,	_ac = '<a href="javascript:;" res="2" pid="'+idx+'">'+p.value.AC+'</a>'
			,	_all = '<a href="javascript:;" res="nil" pid="'+idx+'">'+p.value.all+'</a>';
			$oi.html(_ac+'&nbsp/&nbsp'+_all);
		});
	}
	if ($clone.length) {
		$clone.unbind('click');
		$clone.click(function(){
			if ($logindialog.length > 0) {
				nextURL = '/addcontest?cID=-'+cid+'&type=1';
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
		overviewAjax = $.ajax({
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
,	$limit = $problem.find('span.limit')
,	$link = $('a.splink')
,	F = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
,	ID, problemTimeout
,	ProblemAPI = {}
,	problemAjax;

var $content = $('#content');

var S = ['Problem Description', 'Input', 'Output', 'Sample Input', 'Sample Output', 'Hint', 'Source']
,	$probsubmit = $('#probsubmit')
,	$probsubmit2 = $('#probsubmit2')
,	$rejudge = $('#rejudge');

function ProblemsResponse(prob) {
	if (!problemAjax || !prob || !isActive(1)) return ;
	function getTitle(i) {
		return alias[i] ? alias[i] : prob.title;
	}
	if (!ProblemAPI[ID]) ProblemAPI[ID] = prob;
	$title.eq(0).text( F.charAt(ID) );
	$title.eq(1).text( getTitle(ID) );
	$limit.eq(0).text( 2*prob.timeLimit+'/'+prob.timeLimit );
	$limit.eq(1).text( 2*prob.memoryLimit+'/'+prob.memoryLimit );
	if (prob.spj == 1) {
		$limit.eq(2).html('&nbsp;&nbsp;&nbsp;&nbsp; Special Judge');
	} else if (prob.TC == 1) {
		$limit.eq(2).html('&nbsp;&nbsp;&nbsp;&nbsp; TC 模式');
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
	$probsubmit.attr('pid', prob.problemID); $probsubmit2.attr('pid', prob.problemID);
	$probsubmit.next().attr('pid', ID); $probsubmit2.next().attr('pid', ID);
	$probsubmit.attr('tname', getTitle(ID)); $probsubmit2.attr('tname', getTitle(ID));
	if ($rejudge.length) {
		$rejudge.unbind('click');
		$rejudge.click(function(){
			if ($(this).hasClass('disabled')) {
				return false;
			}
			$(this).addClass('disabled');
			$.post('/rejudge', {pid:prob.problemID, cid:'1'}, function(res){
				$pid.val(F.charAt(ID));
				if (res == '0') ShowMessage('Failed! You have no permission to Rejudge.');
				else if (res == '1') ShowMessage('Problem '+F.charAt(ID)+' has been Rejudged successfully!');
				$tablink.eq(2).click();
			});
		});
	}
	if (PreTab == 1) {
		$probcontain.fadeIn(200);
	} else {
		$problem.fadeIn(200);
	}
	PreTab = 1;
}

function GetProblem() {
	clearTimeout(problemTimeout);
	problemTimeout = setTimeout(function(){
		if (!ID || ID < 0) ID = 0;
		if (ProblemAPI[ID]) {
			ProblemsResponse(ProblemAPI[ID]);
		} else {
			problemAjax = $.ajax({
				type: 'POST',
				url: '/getProblem',
				dataType: 'json',
				data: {
					cid: cid,
					pid: pids[ID],
					all: true
				},
				timeout: 5000
			})
			.done(ProblemsResponse);
		}
	}, interceptorTime);
}

var $rank = $div.find('#ranktab')
,	$ranktbody = $rank.find('table tbody')
,	$ranklist = $('#ranklist')
,	$ranklist_a
,	$rplink
,	rankQ = {cid:cid, page:1}
,	rank = 1
,	rankTimeout
,	FB = {}
,	rankAjax;

function buildRank(U) {
	var user = U.value, html = '<tr class="';

	if (cnt % 2 == 1) html += 'odd';
	else html += 'even';
	if (U.name == current_user) html += ' highlight';

	html += '"><td';
	if (user.solved > 0) {
		if (rank < 31) {
			html += ' class="';
			if (rank < 6) html += 'gold';
			else if (rank < 16) html += 'silver';
			else html += 'bronze';
			html += '"';
		}
	}

	html += '>';
	if (U.star) {
		html += '*';
	} else {
		html += rank++;
	}
	html += '</td>';

	var pvl = parseInt(Users[U.name], 10);
	html += '<td><a href="/user/'+U.name+'" class="user user-'+UserCol(pvl);
	html += '" title="'+UserTitle(pvl)+'">';
	html += U.name+'</a>';
	html += '</div></td><td>';
	if (display == '1') {
		if (I[U.name] && I[U.name].gde && I[U.name].name) {
			html += '<span class="u-info user-gray ellipsis">'+I[U.name].gde+'<br/>'+I[U.name].name+'</span></td>';
		}
	} else if (I[U.name]) {
		html += '<span title="'+I[U.name]+'" class="u-info user-gray ellipsis">'+I[U.name]+'</span>';
	}
	html += '</td><td>'+user.solved+'</td>';
	html += '<td>'+(user.penalty-user.solved*startTime)+'</td>';
	
	for (i = 0; i < prob_num; i++) {
		var pid = fmap[F.charAt(i)];
		html += '<td';
		if (user.status && user.status[pid]) {
			var WA = user.status[pid].wa, st, pt;
			if (WA >= 0) {
				if (FB[pid] == U.name) {
					style = 'fb-text'; st = 'first_blood'; pt = 'fb-cell-time';
				} else {
					style = 'accept-text'; st = 'accept'; pt = 'cell-time';
				}
				html += ' class="'+st+'">'
				
				html += '<span class="'+style+'">+';
				if (WA > 0) html += WA;
				html += '</span>';
				html += '<span class="'+pt+'">'+deal((user.status[pid].inDate-startTime)*60, 1)+'</span>';
			} else if (WA < 0) {
				html += '><span class="failed">'+WA+'</span>';
			}
		} else {
			html += '>';
		}
		html += '</td>';
	}

	++cnt;

	html += '</tr>';
	return html;
}

function RankResponse(json) {
	if (!rankAjax || !json || !isActive(3)) return ;
	rank = parseInt(json.pop(), 10);
	FB = json.pop();
	$ranklist.html( buildPager(rankQ.page, json.pop()) );
	I = json.pop();
	Users = json.pop();
	var users = json.pop();
	if (!users || users.length == 0) {
		html = '<tr class="odd"><td class="error-text center" colspan="'+(5+prob_num)+'">No Records till Now.</tr>';
	} else {
		cnt = 1;
		html = $.map(users, buildRank).join('');
	}
	if ($ranklist_a && $ranklist_a.length) {
		$ranklist_a.unbind('click');
	}
	if ($rplink && $rplink.length) {
		$rplink.unbind('click');
	}
	$ranktbody.html(html);
	$ranklist_a = $ranklist.find('a');
	$ranklist_a.click(function(){
		if ($(this).parent().hasClass('active') || $(this).parent().hasClass('disabled'))
			return false;
		rankQ.page = $(this).parent().attr('id');
		GetRanklist();
	});
	$rplink = $('a.rplink');
	$rplink.click(function(){
		$tablink.eq(1).attr('href', $(this).attr('href'));
		$tablink.eq(1).click();
	});
	$rank.fadeIn(100);
}

function GetRanklist() {
	clearTimeout(rankTimeout);
	rankTimeout = setTimeout(function(){
		if (rankQ.page) {
			window.location.hash = '#rank-'+rankQ.page;
		}
		rankAjax = $.ajax({
			type: 'POST',
			url: '/getRanklist',
			dataType: 'json',
			data: rankQ,
			timeout: 5000
		})
		.done(RankResponse);
	}, interceptorTime);
}

function clearTimer() {
	clearTimeout(overviewTimeout);
	clearTimeout(problemTimeout);
	clearTimeout(searchTimeout);
	clearTimeout(rankTimeout);
}

var $discuss = $div.find('#discusstab')
,	$distbody = $discuss.find('table tbody')
,	$dislist = $('#dislist')
,	$dislist_a
,	discussQ = {cid:cid, page:1}
,	discussTimeout
,	Imgtype
,	discussAjax;

function buildDiscuss(p) {
	var html = '<tr', img;
	if (p.user == current_user) {
		html += ' class="highlight"';
	}
	html += '><td>';
	html += '<a target="_blank" title="'+p.user+'" href="/user/'+p.user+'">';
	if (Imgtype[p.user]) {
		img = '/img/avatar/'+p.user+'/4.'+Imgtype[p.user];
	} else {
		img = '/img/avatar/%3Ddefault%3D/4.jpeg';
	}
	html += '<img class="img_s topic_img" alt="avatar" src="'+img+'" />'
	html += '</a></td><td>';
	html += '<span class="user-green">'+p.reviewsQty+'</span><span class="user-gray">/'+p.browseQty+'</span>';
	html += '</td><td style="text-align:left;" class="ellipsis">';
	html += '<a target="_blank" href="/topic/'+p.id+'">'+p.title+'</a></td>';
	html += '<td></td></tr>';
	return html;
}

function DiscussResponse(json) {
	if (!discussAjax || !json || !isActive(4)) return ;
	Imgtype = json.pop();
	var n = json.pop(), tps = json.pop();
	$dislist.html(buildPager(discussQ.page, n));
	var html;
	if (!tps || tps.length == 0) {
		html = '<tr><td class="error-text" colspan="6">No Records are matched.</td></tr>';
	} else {
		cnt = 1;
		html = $.map(tps, buildDiscuss).join('');
	}
	if ($dislist_a && $dislist_a.length) {
		$dislist_a.unbind('click');
	}
	$distbody.html( html );
	$dislist_a = $dislist.find('a');
	$dislist_a.click(function(){
		if ($(this).parent().hasClass('active') || $(this).parent().hasClass('disabled'))
			return false;
		discussQ.page = $(this).parent().attr('id');
		GetDiscuss();
	});
	$discuss.fadeIn(100);
}

function GetDiscuss() {
	clearTimeout(discussTimeout);
	discussTimeout = setTimeout(function(){
		if (discussQ.page) {
			window.location.hash = '#discuss-'+discussQ.page;
		}
		discussAjax = $.ajax({
			type: 'POST',
			url: '/getTopic',
			dataType: 'json',
			data: discussQ,
			timeout: 5000
		})
		.done(DiscussResponse);
	}, interceptorTime);
}

function run(str, key) {
	clearAjax();
	if (!str) str = 'overview'
	window.location.hash = '#'+str;
	var sp = str.split('-');
	var a = sp[0], b = sp[1], c = sp[2], d = sp[3], e = sp[4];
	ID = 0;
	clearTimer();
	if (a != 'problem' || !PreTab) {
		hideAll();
	}
	for (var i = 0; i < 5; i++) {
		noActive(i);
	}
	switch(a) {
		case 'problem': {
			if (WATCH == 0) break;
			if (b) ID = b.charCodeAt(0)-65;
			if (key == 1) {
				$overview.hide();
			}
			doActive(1);
			if (PreTab == 1) $probcontain.hide();
			GetProblem();
			break;
		}
		case 'status': {
			if (WATCH == 0) break;
			if (key == 1) {
				$overview.hide();
			}
			doActive(2);
			if (b) $search.val(b);
			if (c) $pid.val(c);
			if (d) $result.val(d);
			if (e) statusQ.page = parseInt(e, 10);
			GetStatus();
			PreTab = 0;
			break;
		}
		case 'rank': {
			if (WATCH == 0) break;
			if (key == 1) {
				$overview.hide();
			}
			doActive(3);
			if (b) rankQ.page = parseInt(b, 10);
			GetRanklist();
			PreTab = 0;
			break;
		}
		case 'discuss': {
			if (WATCH == 0) break;
			if (key == 1) {
				$overview.hide();
			}
			doActive(4);
			GetDiscuss();
			PreTab = 0;
			break;
		}
		default: {
			doActive(0);
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
	$.each($p_span, function(i, p){
		alias.push($(p).attr('alias'));
		pids.push($(p).attr('pid'));
		pmap[pids[i]] = F.charAt(i);
		fmap[F.charAt(i)] = pids[i];
	});
	console.log(pmap);

	$link.click(function(){
		if ($(this).parent().hasClass('active')) {
			return false;
		}
		$tablink.eq(1).attr('href', $(this).attr('href'));
		$tablink.eq(1).click();
		run($(this).attr('href').split('#')[1], 2);
	});

	$.each($tablink, function(i, p){
		$(p).click(function(){
			if ($(this).parent().hasClass('active')) {
				return false;
			}
			var tmp = $(this).attr('href').split('#')[1]
			,	href = tmp.split('-')[0];
			run(tmp, 2);
		});
	});

	if (status > 0 || $contest.attr('watch')) {
		WATCH = 1;
		$hid.removeClass('hidden');
		run(window.location.hash.split('#')[1], 1);
	} else {
		run('overview', 1);
	}
}

//run contest
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

function statusInit() {
	$search.val('');
	$pid.val('nil');
	$result.val('nil');
	statusQ.page = 1;
}

//bind status
$(document).ready(function(){
	$Filter.click(function(){
		statusQ.page = 1;
		GetStatus();
	});
	$('#reset').click(function(){
		statusInit();
		GetStatus();
	});
	$search.keyup(function(e){
		if (e.keyCode == 13) {
			$Filter.click();
		}
	});
	bindstatusQ();
});

//bind submit
var $SubmitDialog = $('#submitdialog')
,	$sublink = $('a.consubmit')
,	pid_index;

$(document).ready(function(){
	$.each($sublink, function(i, p) {
		$(p).click(function(){
			if ($logindialog.length) {
				nextURL = '';
				$logindialog.jqmShow();
				return false;
			}
			if (!$SubmitDialog.length) {
				ShowMessage('You can not submit because you have not registered the contest yet!');
				return false;
			}
			$SubmitDialog.find('#error').html('&nbsp;');
			$SubmitDialog.find('#lang').val(2);
			$SubmitDialog.find('textarea').val('');
			pid_index = $(this).attr('pid');
			$SubmitDialog.find('span#pid').text(pmap[pid_index]+' - '+$(this).attr('tname'));
			$SubmitDialog.jqmShow();
		});
	});

	if ($SubmitDialog.length) {
		$SubmitDialog.jqm({
			overlay: 30,
			trigger: false,
			modal: true,
			closeClass: 'submitclose',
			onShow: function(h) {
				h.o.fadeIn(200);
				h.w.fadeIn(200, function(){$SubmitDialog.find('textarea').focus();});
			},
			onHide: function(h) {
				h.w.fadeOut(200);
				h.o.fadeOut(200);
			}
		}).jqDrag('.jqDrag').jqResize('.jqResize');
		var $submit_code = $SubmitDialog.find('textarea')
		,	$submit_err = $SubmitDialog.find('span#error');
		$SubmitDialog.find('a#jqcodesubmit').click(function(){
			var code = $submit_code.val();
			if (code.length < 50 || code.length > 65536) {
				errAnimate($submit_err, 'the length of code must be between 50B to 65535B');
				return false;
			}
			$.post('/submit', {
				pid: pid_index,
				cid: cid,
				code: code,
				lang: $SubmitDialog.find('select').val()
			}, function(err){
				if (err == '1') {
					window.location.reload(true);
					return ;
				}
				$SubmitDialog.jqmHide();
				if (!err) {
					ShowMessage('Your code for problem '+pmap[pid_index]+' has been submited successfully!');
				} else if (err == '2'){
					ShowMessage('You can not submit because you have not registered the contest yet!');
				} else if (err == '3') {
					ShowMessage('系统错误！');
				}
				$tablink.eq(2).click();
			});
		});
	}
});

var $del = $('a#delete');

$(document).ready(function(){
	if ($del.length) {
		$del.click(function(){
			if (!window.confirm('Are you sure to delete this contest?')) {
				return false;
			}
			$.post('/contestDelete', {cid:cid}, function(){
				window.location.href = '/contest/'+ctype;
			});
		});
	}
});

//show problems in problemset
var $toggleHide = $('a.toggleHide');

$(document).ready(function(){
	if ($toggleHide.length) {
		$toggleHide.click(function(){
			var $p = $(this);
			if ($p.hasClass('disabled')) {
				return false;
			}
			$p.addClass('disabled');
			var pid = $p.attr('pid');
			$.post('/toggleHide', {pid: pid}, function(res){
				if (res == '1') {
					ShowMessage('系统错误！');
				} else if (res == '2') {
					window.location.reload(true);
				} else {
					if (res == 'h') {
						$p.text('显示到题库');
					} else {
						$p.text('隐藏');
					}
					ShowMessage('Problem '+pid+' have been Updated successfully!');
				}
				$p.removeClass('disabled');
			});
		});
	}
});

//add user
var $adduser = $('#user-add')
,	$userstr = $('#userstr')
,	$adderr = $('#adderr');

$(document).ready(function(){
	if ($adduser.length) {
		$adduser.click(function(){
			var name = JudgeString($userstr.val());
			if (!name) {
				errAnimate($adderr, '用户名不能为空！');
				return false;
			}
			$.post('/regContestAdd', {cid:cid,name:name}, function(){
				window.location.reload(true);
			});
		});
	}
});

//toggle star
var $star = $('#star')
,	$starstr = $('#starstr')
,	$starerr = $('#starerr');

$(document).ready(function(){
	if ($star.length) {
		$star.click(function(){
			var str = JudgeString($starstr.val());
			if (!str) {
				errAnimate($starerr, '用户名不能为空！');
				return false;
			}
			$.post('/toggleStar', {cid:cid,str:str,type:$('#type').val()}, function(){
				window.location.reload(true);
			});
		});
	}
});

//add discuss
var $publish = $('#publish')
,	$publish_pid = $('#publish_pid')
,	$publish_err = $('#publish_err')
,	$publish_title = $('#publish_title')
,	$publish_content = $('#publish_content');

$(document).ready(function(){
	$publish.click(function(){
		var title = JudgeString($publish_title.val());
		if (!title) {
			errAnimate($publish_err, '标题不能为空！');
			return false;
		}
		var content = JudgeString($publish_content.attr('value'));
		if (!content) {
			errAnimate($publish_err, '内容不能为空！');
			return false;
		}
		if ($publish.hasClass('disabled')) {
			return false;
		}
		$publish.addClass('disabled');
		$.post('/addDiscuss', {cid: cid, title:$publish_pid.val()+'题：'+title, content:content}, function(res){
			if (!res) {
				GetDiscuss();
				ShowMessage('发表成功！');
			} else if (res == '1') {
				ShowMessage('系统错误！');
			} else if (res == '2') {
				window.location.href = '/';
			}
		});
	});
});

function hideAll() {
	$problem.hide();
	$status.hide();
	$rank.hide();
	$discuss.hide();
	$overview.hide();
}

function clearAjax() {
	if (overviewAjax) overviewAjax.abort();
	if (problemAjax) problemAjax.abort();
	if (statusAjax) statusAjax.abort();
	if (rankAjax) rankAjax.abort();
	if (discussAjax) discussAjax.abort();
}