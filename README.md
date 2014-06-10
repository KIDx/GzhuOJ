# Gzhu Online Judge v6.1.3

## ubuntu下搭建开发环境

### 安装依赖
```
$ sudo apt-get update
$ sudo apt-get install imagemagick
$ sudo apt-get install python-software-properties python g++ make
$ sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential
```

### 安装node.js
```
$ sudo add-apt-repository ppa:chris-lea/node.js
$ sudo apt-get update
$ sudo apt-get install nodejs
```

### 安装mongodb数据库
http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/

### 数据库初始化
```
$ cd GzhuOJ
$ mongorestore -h localhost -d gzhu_db --directoryperdb gzhu_db -drop
```

### 安装依赖模块
```
$ cd GzhuOJ
$ sudo npm i
```

### 运行app
```
$ cd GzhuOJ
$ node app.js
```