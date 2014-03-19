# Gzhu Online Judge v6.0.6

* user页面增加恢复默认密码"123456"功能(for admin)
* 删除了public文件夹中无用的socket.io文件夹

# Gzhu Online Judge v6.0.5

* 提供对C#的支持
* 修改评测数据目录的位置

# Gzhu Online Judge v6.0.4

* contest进度条增加clear:both，兼容IE7
* 增加10个方形QQ表情

# Gzhu Online Judge v6.0.3

* 修复批量注册会出现系统错误的bug(index.js)
* contest的题目不再缓存，每次都去服务器拿最新的(onecontest.js)
* 对网站增加静态资源缓存(app.js)
* 合并某些js文件，减少客户端发送响应次数
* 压缩某些不改动的js文件
* 修复admin不能为别人的contest打星的bug(index.js)
* 修复ckeditor插入表情路径太绝对导致服务器一旦改变地址就显示不了的bug
* 修复nginx+websocket出错的bug(app.js: io.set('transports', ...))

# Gzhu Online Judge v6.0.2

* 修改了onecourse页面样式，兼容IE7
* 修复contest页面problemlink可以同时多个active的bug
* 将ckeditor从v3.6.x更新到v4.3.1

# Gzhu Online Judge v6.0.1

* 主页样式兼容IE7
* 修改了难度列表
* problemset，problem页面的star兼容IE7

# Gzhu Online Judge v6.0.0

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