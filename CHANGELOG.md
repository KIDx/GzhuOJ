## 6.1.0 / 2014-06-04
* 重构上传的逻辑
* 每10秒更新一次排名改为每30秒更新一次
* 自己的排名永远可见
* 设置cookie过期时间为一天
* 新增题初始化为隐藏
* 修复管理员添加用户到比赛后，用户需要刷新才能提交代码的问题

## 6.0.14 / 2014-05-15
* 修复了不能查询java RE记录的bug
* 设置cookie过期时间为一个小时
* 比赛排名每10秒自动更新1次
* status页面其他人看不到admin提交记录的详细参数

## 6.0.13 / 2014-04-21
* 修改默认头像
* 模态对话框居中
* 修复上传文件自动重命名的bug
* update gitignore

## 6.0.12 / 2014-04-12
* 修复contest那边rejudge后不能跳转的bug
* problem和problemset页面的标签先按大小sort一下再显示
* 为了可靠性和性能，提交代码后不使用iconv转码
* 所有相关模块更新至"express 4.x"

## 6.0.11 / 2014-04-06
* solution字段inDate数据类型改为Number
* contest字段startTime数据类型改为Number
* 修改getDate函数，增加其易用性

## 6.0.10 / 2014-04-05
* problem增加lastmodified字段，onecontest缓存problem
* onecontest的rank增加刷新按钮
* 改善部分细节

## 6.0.9 / 2014-03-30
* 修复了addtopic编辑内容显示源码的bug (addtopic.ejs, editproblem.ejs)

## 6.0.8 / 2014-03-27
* 学院增加了腾讯、网易等
* 若不是计算机学院，VIP contest的rank页第三列显示单位简称而不是班别
* 修复了比赛排名FB不准确的bug
* 修复了user页面清除不了用户认证的bug

## 6.0.7 / 2014-03-22
* VIP Contest中的Rank页增加移除参赛者功能(for admin)
* Add Student页面(for admin)增加csv文件内容说明

## 6.0.6 / 2014-03-19
* user页面增加恢复默认密码"123456"功能(for admin)
* 删除了public文件夹中无用的socket.io文件夹

## 6.0.5 / 2014-01-26
* 提供对C#的支持
* 修改评测数据目录的位置

## 6.0.4 / 2014-01-12
* contest进度条增加clear:both，兼容IE7
* 增加10个方形QQ表情

## 6.0.3 / 2014-01-10
* 修复批量注册会出现系统错误的bug(index.js)
* contest的题目不再缓存，每次都去服务器拿最新的(onecontest.js)
* 对网站增加静态资源缓存(app.js)
* 合并某些js文件，减少客户端发送响应次数
* 压缩某些不改动的js文件
* 修复admin不能为别人的contest打星的bug(index.js)
* 修复ckeditor插入表情路径太绝对导致服务器一旦改变地址就显示不了的bug
* 修复nginx+websocket出错的bug(app.js: io.set('transports', ...))

## 6.0.2 / 2013-12-30
* 修改了onecourse页面样式，兼容IE7
* 修复contest页面problemlink可以同时多个active的bug
* 将ckeditor从v3.6.x更新到v4.3.1

## 6.0.1 / 2013-12-26
* 主页样式兼容IE7
* 修改了难度列表
* problemset，problem页面的star兼容IE7

## 6.0.0 / 2013-12-25
* 编辑话题时不需要验证码
* 修改user页面的样式
* 将users表的regTime字段数据类型修改为Number
* 增加新字段visTime(最后登录时间, Number)
* problems表新增字段easy（容易度, Number）
* 重构problemset页面布局并修改部分样式，修改problem页面部分内容及样式
* 修改了getTime函数(topic页面, onetopic页面)，增加getAboutTime函数(user页面)
* 修复VIP contest的public contest客户端与服务器端协议不一致的问题（报名部分）
* VIP Contest显示Manager改为显示参加比赛人数
* contest增加loading图片提示
* 增加hashchange插件，重构contest客户端，点击后退可能
* contest所有ajax增加失败重发请求的功能
* 完善ajax获取题目具体内容前的服务器验证（比赛是否已开始，用户是否具有权限等）
* 主页完全重构，新增公告等功能
* problem页面左侧新增Edit Problem，有加题权限可见