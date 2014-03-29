# Gzhu Online Judge v6.0.8

## 如何快速搭建(ubuntu下测试通过)

* 安装依赖
```
$ sudo apt-get update
$ sudo apt-get install g++ curl libssl-dev apache2-utils
$ sudo apt-get install python-software-properties
$ sudo apt-get install imagemagick
$ sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
```
* 安装node.js
```
$ sudo add-apt-repository ppa:chris-lea/node.js 
$ sudo apt-get update 
$ sudo apt-get install nodejs
```

* 安装mongodb数据库
http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/

* 安装依赖模块
```
$ cd GzhuOJ
$ sudo npm i
```

* 如果上面的"sudo npm i"等很久都没反应，安装并使用nrm切换到其他registry
```
$ sudo npm i -g nrm
$ nrm ls
$ nrm use cnpm
```

* 运行 app
```
$ node GzhuOJ/app.js
```