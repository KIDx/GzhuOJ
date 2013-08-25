
//rankpage未完成!!!

var WATCH = 0, star;
var AllstatusAPI = new Array(), RankAPI = {}, ProblemAPI = {}, Users = {}, Star = {};
//缓存的最大runID，只需获取比这个id大的提交记录即可
var current_max_runid = 0;
//提交的最后结果(由updatestatus.js更新)
var FinalRes = {}, FinalTime = {}, FinalMemory = {};
//用户浏览的当前题目的信息
var pid_index, pid_name, ID;
//标记之前浏览页是否为problem页
var PreTab = 0;

var F = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var $pidtext = $('span.cpid');
var k = $pidtext.length;
//pmap[pid]='A, B, C...', fmap['A, B, C...'] = pid
var pmap = {}, fmap = {};

var barFlg = 0;
var $div = $('#thumbnail');
var $overview = $div.find('#overviewtab');
var $problem = $div.find('#problemtab');
var $probcontain = $problem.children('#prob-contain');
var $status = $div.find('#statustab');
var $rank = $div.find('#ranktab');
var $ranktbody = $rank.find('div.tablebg table tbody');

var $problemlink = $problem.find("li.problemlink");
var $title = $problem.find('h3#problem_title > span');
var $limit = $problem.find('font.limit');
var $link = $('a.splink');

var $overviewtable = $('#overviewtable tr td');
var $contestStatus = $overviewtable.eq(3);
var Manager = $overviewtable.eq(5).text();
var $overprobtable = $overview.find('#problems');
var $probrow = $overprobtable.find('tbody tr');
var $probsol = $probrow.find('td:eq(3)');

var $SubmitDialog = $('#submitdialog');
var $submitpid = $SubmitDialog.find('span#pid');
var $divpids = $('div#pids');

var $hid = $('div.hidden, li.hidden');
var $tablink = $('a[data-toggle="tab"]');

var $tablebg = $('div.tablebg');
var $pagehead = $tablebg.find('div.pagination ul');
var $pages = $pagehead.find('li');
var $tbody = $tablebg.find('#statustable tbody');

var $search = $('input#search');
var $pid = $('select#pID');
var $what = $('select#what');
var $Filter = $status.find('button#filter');

var contest_private = $overview.attr('psd');
var curl = $overview.attr('curl');
var cnt = 1, cid = $overview.attr('cid');
var startTime = $overviewtable.eq(2).text();
var endTime, TotalTime, passTime = -1;
var Running = false;
var pending, Contestants = new Array();

var $Delete = $('#deletedialog');

var $progress = $('#progress');
var $bar = $progress.children('div.bar');
var $info = $('#contest-info');

var $contain = $('#info-contain');
var $lefttime;
var $marquee = $('#marquee');

var $content = $('#content');

function Bind() {
	var $ranktd = $ranktbody.find('tr').find('td:eq(0)');
	$(':checkbox').each(function(i, p){
		$(p).change(function(){
			var name = $(p).next().text(), flg;
			if (Star[name]) flg = '1';
			$.post('/toStar', {cid:cid,user:name,star:Star[name]}, function(){
				window.location.reload(true);
			});
		});
	});
	$('a.user-del').click(function(){
		$.post('/regContestDel', {cid:cid,name:$(this).prev().text()}, function(){
			window.location.reload(true);
		});
	});
	$('#user-add').click(function(){
		$.post('/regContestAdd', {cid:cid,name:$(this).prev().val()}, function(){
			window.location.reload(true);
		});
	});
}

var $consubmit = $('a.consubmit');
function BindSubmit() {
	$consubmit.click(function(){
		if ($logindialog.length > 0) {
			nextURL = '';
			$logindialog.jqmShow();
			return ;
		}
		var $tps = $(this);
		$SubmitDialog.find('#error').html('&nbsp;');
		$SubmitDialog.find('#lang').val(2);
		$SubmitDialog.find('textarea').val('');
		pid_index = $tps.attr('pid');
		$submitpid.text(pmap[pid_index]+' - '+$tps.attr('tname'));
		$SubmitDialog.jqmShow();
	});
}

var FB = {};
function buildRank(user) {
	var html = '<tr class="';

	if (cnt % 2 == 1) html += 'odd';
	else html += 'even';
	if (user.name == current_user) html += ' highlight';

	html += '"><td';
	var rank = RankAPI[user.name]-star;
	if (!Star[user.name] && user.solved > 0) {
		if (rank < 31) {
			html += ' class="';
			if (rank < 6) html += 'gold';
			else if (rank < 16) html += 'silver';
			else html += 'bronze';
			html += '"';
		}
	}
	html += '>';
	if (Star[user.name]) html += '*', ++star;
	else html += rank;
	html += '</td><td><div class="u-info">';

	var pvl;
	if (contest_type == 2 && contest_private && Users[user.name].gde) {
		pvl = parseInt(Users[user.name].pvl);
		html += '<span class="u-info-u">'+Users[user.name].gde+'<br/>'+Users[user.name].name+'</span>';
		if (current_user == 'admin') {
			html += '<input type="checkbox" title="Add star"';
			if (Star[user.name]) html += ' checked';
			html += '/>&nbsp;';
		}
	} else pvl = parseInt(Users[user.name]);

	html += '<a href="/user/'+user.name+'" class="user user-';
	html += UserCol(pvl)+'" title="'+UserTitle(pvl)+'">';
	html += user.name+'</a>';
	if (contest_type == 2 && current_user == 'admin')
		html += '<a href="javascript:;" title="Delete the user" class="user-del">×</a>'
	html += '</div></td>';
	html += '<td>'+user.solved+'</td>';
	html += '<td>'+user.penalty+'</td>';
	$.each(user.status, function(i, v){
		var style = '', WA = v;
		html += '<td>';
		if (WA > 0) {
			--WA;
			if (FB[i] == user.stime[i]) style = 'FB';
			else style = 'accept';
			html += '<span class="'+style+'">+';
			if (WA > 0) html += WA;
			html += '</span>';
			html += '<span class="cell-time">'+user.stime[i]+'</span>';
		} else if (WA < 0) {
			html += '<span class="failed">'+WA+'</span>';
		}
		html += '</td>';
	});
	html += '</tr>';
	++cnt;
	return html;
}

function RankResponse(json) {
	if (contest_type != 2) {
		var tmp = json.pop();
		$.each(tmp, function(i, p){
			if (!Users[i])
				Users[i] = p;
		});
	}
	if (json.length > 0 && current_max_runid < json[0].runID) {
		current_max_runid = json[0].runID;
		AllstatusAPI = json.concat(AllstatusAPI);
	}
	var idx = 0, rank = new Array(), hash = {}, current_id;
	var Stmp = AllstatusAPI.concat().reverse();
	for (var j = 0; j < Stmp.length; j++) {
		var p = Stmp[j];
		if (p.inDate < startTime || p.userName == 'admin') continue;
		if (p.inDate > endTime) break;
		if (hash[p.userName] == null) {
			hash[p.userName] = idx;
			rank[idx] = {
				name:p.userName,
				solved: 0,
				penalty: 0,
				status: {},
				stime: {}
			};
			for (var i = 0; i < k; i++)
				rank[idx].status[F.charAt(i)] = 0;
			current_id = idx;
			idx++;
		} else { current_id = hash[p.userName]; }
		if (rank[current_id].status[pmap[p.problemID]] <= 0) {
			if (p.result == 2) {
				var WA = -rank[current_id].status[pmap[p.problemID]];
				rank[current_id].status[pmap[p.problemID]] = 1+WA;
				++rank[current_id].solved;
				var stime = calTime($overviewtable.eq(2).text(), p.inDate);
				rank[current_id].penalty += parseInt(stime/60) + WA*20;
				rank[current_id].stime[pmap[p.problemID]] = deal(stime, 1);
			} else {
				--rank[current_id].status[pmap[p.problemID]];
			}
		}
	}

	if (rank.length > 1) {
		rank.sort(function(a, b) {
			if (a.solved == b.solved)
				return a.penalty < b.penalty ? -1 : 1;
			return a.solved > b.solved ? -1 : 1;
		});
	}

	if (contest_type == 2 && Contestants) {
		for (var j = 0; j < Contestants.length-1; j++) {
			var p = Contestants[j];
			if (hash[p] == null) {
				rank[idx] = {name:p, solved:0, penalty:0, status:{}, stime:{}};
				for (var i = 0; i < k; i++) rank[idx].status[F.charAt(i)] = 0;
				++idx;
			}
		}
	}

	if (rank.length == 0) {
		var str = '<tr class="odd"><td class="error-text center" colspan="'+(4+k)+'">';
		if (contest_type == 2) {
			str += 'No body has registered the Contest yet.';
		} else str += 'There is No Submitions during the contest.';
		str += '</td></tr>';
		$ranktbody.html(str);
		updatePage(0, 0, 1);
		$rank.fadeIn(100);
		if (contest_type == 2 && current_user == 'admin') Bind();
		return ;
	}

	for (var i = 0; i < k; i++)
		FB[F.charAt(i)] = null;

	for (var i = 0; i < rank.length; i++) {
		RankAPI[rank[i].name] = i+1;
		$.each(rank[i].stime, function(a, b){
			if (!FB[a] || b < FB[a])
				FB[a] = b;
		});
	}
	
	cnt = 1; star = 0;
	$ranktbody.html( $.map(rank, buildRank).join('') );
	$rank.fadeIn(100);
	if (contest_type == 2 && current_user == 'admin') Bind();
}

var S = ['Problem Description', 'Input', 'Output', 'Sample Input', 'Sample Output', 'Hint', 'Source'];
var $probsubmit = $('#probsubmit');
var $rejudge = $('#rejudge');

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
				setTimeout(function(){
					$pid.val(F.charAt(ID));
					$tablink.eq(2).click();
					if (res == '0') ShowMessage('Failed! You have no permission to Rejudge.');
					else if (res == '1') ShowMessage('Problem '+F.charAt(ID)+' has been Rejudged successfully!')
				}, 100);
			})
		});
	}
	if (PreTab == 1) $probcontain.fadeIn(200);
	else $problem.fadeIn(200);
	PreTab = 1;
	BindQuery();
}

function OverviewResponse(json) {
	if (contest_type != 2) {
		var tmp = json.pop();
		$.each(tmp, function(i, p){
			if (!Users[i])
				Users[i] = p;
		});
	}
	if (json.length > 0 && current_max_runid < json[0].runID) {
		current_max_runid = json[0].runID;
		AllstatusAPI = json.concat(AllstatusAPI);
	}
	var AC = {}, Sbm = {}, Sts = {};
	for (var i = 0; i < AllstatusAPI.length; i++) {
		var p = AllstatusAPI[i];
		if (p.userName != 'admin') {
			var tid = pmap[p.problemID];
			if (p.result == 2) {
				if (AC[tid] == null) AC[tid] = 0;
				++AC[tid];
				if (current_user == p.userName)
					Sts[tid] = 1;
			} else if (p.result >= 0) {
				if (current_user == p.userName && Sts[tid] == null)
					Sts[tid] = 0;
			}
			if (Sbm[tid] == null) Sbm[tid] = 0;
			++Sbm[tid];
		}
	}
	$.each(Sbm, function(i, v){
		var ac = 0, ti = i.charCodeAt(0)-65;
		if (AC[i] != null) ac = AC[i];
		$probsol.eq(ti).html('<a href="javascript:;" res="2" pid="'+ti+'">'+ac+'</a> / <a href="javascript:;" res="-1" pid="'+ti+'">'+v+'</a>');
		if (Sts[i] != null) {
			var $ttd = $probrow.eq(ti).find('td');
			if (Sts[i] == 1) {
				$ttd.eq(0).addClass('AC');
				$ttd.eq(2).addClass('AC-fill');
			} else {
				$ttd.eq(0).addClass('WA');
				$ttd.eq(2).addClass('WA-fill');
			}
		}
	});
	$overview.fadeIn(100);
	BindQuery();
}

function GetContestProblem() {
	if (!ID || ID < 0) ID = 0;
	pid_index = $pidtext.eq(ID).attr('id');
	pid_name = $pidtext.eq(ID).text();
	if (ProblemAPI[ID]) {
		ProblemsResponse(ProblemAPI[ID]);
		$.ajax({
			type: 'POST',
			url: '/getProblem',
			data: {
				curl: 'problem/'+F.charAt(ID),
				cid: cid
			}
		});
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
}

/*******************status页的单独ajax*******************/
var Query = { pagenum:25, cid:cid, page:1 };
var searchTimeout;
var $plink;

function BindQuery() {
	$('a[res]').click(function(){
		$pid.val(F.charAt($(this).attr('pid')));
		$what.val($(this).attr('res'));
		$tablink.eq(2).click();
	});
}

function buildRow(sol) {
	//if there is final result for sol, change the sol.result to final result
	if (sol.result < 2 && FinalRes[sol.runID]) {
		sol.result = FinalRes[sol.runID];
		sol.time = FinalTime[sol.runID];
		sol.memory = FinalMemory[sol.runID];
	}
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
	html += '<td><a class="plink" href="#problem/'+pmap[sol.problemID]+'">'+pmap[sol.problemID]+'</a></td>';

	html += '<th';
	if (sol.result == 8 && (sol.userName == current_user || current_user == 'admin')) {
		html += '><a href="javascript:;" rid="'+sol.runID+'" class="CE '+Col(sol.result)+'">'+Res(sol.result)+'</a>';
	} else {
		html += ' class="'+Col(sol.result)+'">'+Res(sol.result);
		if (sol.result < 2) html += '...';
	}
	html += '</th>';

	var tpstr = '---', watch = 0;

	if (current_user == Manager || current_user == sol.userName) {
		watch = 1;
		tpstr = sol.time+' MS';
	}
	if (sol.result == 0) {
		tpstr = '<img src="img/pending.gif"/><img style="display:none;width:14px;height:14px;" src="img/running.gif"/>';
	} else if (sol.result == 1) {
		tpstr = '<img style="display:none;" src="img/pending.gif"/><img style="width:14px;height:14px;" src="img/running.gif"/>';
	}
	html += '<td>'+tpstr+'</td>';
	tpstr = '---';
	if (watch == 1) {
		tpstr = sol.memory+' KB';
	}
	html += '<td>'+tpstr+'</td>';

	var lang = sol.language, str = 'C';
	if (lang == 2) str = 'C++';
	else if (lang == 3) str = 'Java';
	
	if (watch == 1) {
		html += '<td><a target="_blank" href="/sourcecode?runID='+sol.runID+'">'+str+'</a></td>'
	} else {
		html += '<td>'+str+'</td>';
	}

	if (watch == 1) {
		tpstr = sol.length+' B';
	}
	html += '<td>'+tpstr+'</td>';
	html += '<td>'+sol.inDate+'</td>';
	html += '</tr>';
	return html;
}

function ClickResponse() {
	if ($(this).hasClass('active') || $(this).hasClass('nothing'))
		return false;
	Query.page = $(this).attr('id');
	post();
	$search.focus();
	var str = $search.val();
	if (str) $search.val(''), $search.val(str);
}

function updatePage(n) {
	if (n <= 0) n = 1;
	var pn = parseInt((n+Query.pagenum-1)/Query.pagenum);
	$pagehead.html(buildPager(Query.page, pn));
	$pages = $pagehead.find('li');
	$pages.click(ClickResponse);
}

function Response(json) {
	var tmp = json.pop();
	$.each(tmp, function(i, p){
		if (!Users[i])
			Users[i] = p;
	});
	updatePage(json.pop());
	var html;
	if (json.length == 0) {
		html = '<tr class="odd"><td class="error-text center" colspan="9">No Status are matched.</td></tr>';
	} else {
		cnt = 1;
		html = $.map(json, buildRow).join('');
	}
	if ($plink && $plink.length) {
		$plink.unbind();
		$plink.remove();
	}
	$tbody.html( html );
	$plink = $('a.plink');
	$plink.click(function(){
		$tablink.eq(1).attr('href', $(this).attr('href'));
		$tablink.eq(1).click();
	});
	BindCE();
}

function post() {
	$.ajax({
		type: 'POST',
		url: '/status',
		dataType: 'json',
		data: Query,
		timeout: 5000
	})
	.done(Response);
}

function Run() {
	var ts = trim($search.val()), tp = trim($pid.val()), tw = $what.val();
	if (tp == '-1') tp = '';
	else tp = fmap[tp];
	Query.search = ts;
	Query.pid = tp;
	Query.what = tw;
	clearTimeout(searchTimeout);
	Query.page = 1;
	searchTimeout = setTimeout(post, 300);
}

function GetContestStatus() {
	$Filter.click();
	$status.fadeIn(100);
}
/*******************status页的单独ajax*******************/

function GetContestRanklist() {
	$.ajax({
		type: 'POST',
		url: '/getContestStatus',
		dataType: 'json',
		data: {
			curl: 'rank',
			cid: cid,
			all: true,
			min_runid: current_max_runid,
			type: contest_type
		},
		timeout: 5000
	})
	.done(RankResponse);
}

function GetOverview() {
	$.ajax({
		type: 'POST',
		url: '/getContestStatus',
		dataType: 'json',
		data: {
			curl: 'overview',
			cid: cid,
			all: true,
			min_runid: current_max_runid,
			type: contest_type
		},
		timeout: 5000
	})
	.done(OverviewResponse);
}

function ShowOverview() {
	$overview.fadeIn(100);
}

function run(str, key) {
	if (!str) str = '#overview'
	var d = str.split('/');
	var a = d[0], b = d[1];
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
			GetContestProblem();
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
			GetContestStatus();
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
			GetContestRanklist();
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
				ShowOverview();
				PreTab = -1;
			} else {
				GetOverview();
				PreTab = 0;
			}
			break;
		}
	}
}

function contestTimer() {
	$overviewtable.eq(0).text(current_time);
	if (pending >= 0) {
		var left = deal(pending);
		var infoleft = '-'+left;
		if (infoleft != $info.text()) $info.text(infoleft);
		--pending;
		if (barFlg == 0) {
			barFlg = 1;
			$overviewtable.eq(3).html('<font color="#BE780E">Pending</font>');
			if (WATCH == 0) {
				$('#problemsview').before('<div class="user-gray" style="text-align:center;font-size:1.75em;margin:100px;">Before Contest <span id="lefttime">'+left+'</span></div>');
				$lefttime = $('#lefttime');
			}
		}
		if (WATCH == 0) {
			if (left != $lefttime.text()) $lefttime.text(left);
			if (pending < 0) {
				window.location.reload(true);
			}
		}
	} else {
		if (pending + TotalTime < 0 || passTime > TotalTime) {
			if (Running || barFlg == 0) {
				barFlg = 1;
				Running = false;
				$progress.addClass('progress-success');
				$info.text('');
				$overviewtable.eq(3).html('<font color="green">Ended</font>');
				$('div#btn-group').prepend('<a href="javascript:;" class="uibtn checklogin" id="clone" title="To create a DIY Contest whit the same problems">Clone this contest</a>');
				$('a#clone').click(function(){
					if ($logindialog.length > 0) {
						nextURL = '/addcontest?cID=-'+document.URL.split('?cID=')[1]+'&type=1';
						$logindialog.jqmShow();
					} else {
						window.location.href = '/addcontest?cID=-'+cid+'&type=1';
					}
				});
			}
		} else {
			if (passTime < 0) {
				$overviewtable.eq(3).html('<font color="#DD1111">Running</font>');
				passTime = calTime(startTime, current_time);
			}
			Running = true;
			$progress.addClass('progress-danger');
			var tp = passTime*100.0/TotalTime;
			if (tp > 50) $contain.css({'text-align':'left'});
			$bar.css({width:tp+'%'});
			$info.css({width:(100<=tp+2.5)?'100%':tp+2.5+'%'});
			$info.text('-'+deal(TotalTime - passTime));
			++passTime;
		}
	}
}

function runContest() {
	//check current_user
	if (pending <= 0 ||
		(current_user && current_user == Manager)) {
		WATCH = 1;
		$hid.removeClass('hidden');
		run('#'+curl, 1);
	} else {
		run('#overview', 1);
	}

	contestTimer();
	setInterval(contestTimer, 1000);

	//bulid map pmap and fmap
	$.each($pidtext, function(i) {
		var tpid = $(this).attr('id'), tch = F.charAt(i);
		pmap[tpid] = tch;
		fmap[tch] = tpid;
	});

	$link.click(function(){
		if ($(this).parent().hasClass('active')) return false;
		$tablink.eq(1).attr('href', $(this).attr('href'));
		$tablink.eq(1).click();
		run($(this).attr('href'), 2);
	});

	$tablink.on('show', function(e){
		//e.target;			// activated tab
		//e.relatedTarget	// previous tab
		var href = $(e.relatedTarget).attr('href').split('/')[0];
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
}

function get_msg() {
	$.post('/marquee', {cid:cid}, function(res){
		$marquee.text(res);
	});
}

function init() {
	$search.val('');
	$pid.val(-1);
	$what.val(-1);
}

$(document).ready(function(){
	if ($div.length == 0) return ;
	$Filter.click(function(){
		Run();
	});
	Query.search = Query.pid = Query.what = '';
	//setInterval(get_msg, 120000);

	contest_type = $overview.attr('ct');
	$overview.removeAttr('ct');
	TotalTime = parseInt($overview.attr('len'));
	$overview.removeAttr('len');
	endTime = calDate(startTime, TotalTime)+':00';

	TotalTime *= 60;
	$progress.next().text(deal(TotalTime));
	$overviewtable.eq(4).text(endTime);

	pending = calTime(current_time, startTime);

	if (contest_type == 2) {
		$.ajax({
			type: 'POST',
			url: '/getPrivilege',
			dataType: 'json',
			data: {cid: cid}
		}).done(function(jsons){
			if (jsons) {
				Users = jsons.pop();
				Contestants = jsons.pop();
			}
			runContest();
		});	
	} else runContest();

	BindSubmit();
});

$(document).ready(function(){
	if ($div.length == 0) return ;

	$status.find('button#reset').click(function(){
		init();
		$Filter.click();
	});
	$search.keyup(function(e){
		if (e.keyCode == 13) {
			$Filter.click();
		}
		return false;
	});

	//delete the contest
	if ($Delete.length > 0) {
		$Delete.jqm({
			overlay: 30,
			trigger: $('a#delete'),
			modal: true,
			closeClass: 'deleteclose',
			onShow: function(h) {
				h.o.fadeIn(200);
				h.w.fadeIn(200);
			},
			onHide: function(h) {
				h.w.fadeOut(200);
				h.o.fadeOut(200);
			}
		}).jqDrag('.jqDrag');
		$Delete.find('a#sure').click(function(){
			$.post('/contestDelete', {cid:cid}, function(){
				window.location.href = '/contest?type='+contest_type;
			});
		});
	}

	//设置submit窗口
	if ($SubmitDialog.length > 0) {
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
	}

	//submit code
	$SubmitDialog.find('a#jqcodesubmit').click(function(){
		var code = $SubmitDialog.find('textarea').val();
		if (code.length < 50 || code.length > 65536) {
			$SubmitDialog.find('span#error').text('the length of code must be between 50B to 65535B');
			return false;
		}
		if (Contestants.length) {
			for (i = 0; i < Contestants.length; i++)
				if (Contestants[i] == current_user)
					break;
			if (i >= Contestants.length) {
				$SubmitDialog.jqmHide();
				ShowMessage('You can not submit because you have not registered the contest yet!');
				return false;
			}
		}
		$.post('/submit', {
			pid: pid_index,
			cid: cid,
			code: code,
			lang: $SubmitDialog.find('select').val()
		}, function(err){
			$SubmitDialog.jqmHide();
			if (err) {
				if (err == '3') ShowMessage('Server Error!');
				else window.location.reload(true);
				return ;
			}
			init();
			$tablink.eq(2).click();
			ShowMessage('Your code for problem '+pmap[pid_index]+' has been submited successfully!');
		});
	});
});