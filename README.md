基于yeoman-generator脚手架工具，支持传入swagger文档地址构造typescript的d.ts文件以及接口模型。

```
// 全局安装yo
npm install -g yo;
// 进入该项目执行
npm link
// 执行
yo swagger-to-ts-schema
// 带参数执行
yo swagger-to-ts-schema --url=http://localhost:8080/swagger-ui.html --className='$api'
```

模板引擎ejs
https://ejs.bootcss.com/#docs
