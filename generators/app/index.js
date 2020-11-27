const Generator = require("yeoman-generator");
const yosay = require("yosay");
const codegen = require("../codegen");
const axios = require("axios");
const fs = require("fs");

function getSwaggerJson(url) {
    if (url.includes("swagger-ui.html")) {
        return url.replace("swagger-ui.html", "v2/api-docs?group=Default");
    }
    return url;
}

module.exports = class extends (
    Generator
) {
    constructor(args, opts) {
        super(args, opts);
        this.option("babel"); // This method adds support for a `--babel` flag
    }

    prompting() {
        let props = {};
        let prompts = [];
        let welcomeMsg = `欢迎使用 swagger to typescript schema`;

        if (this.options.debug) {
            props.debug = true;
            welcomeMsg += "（debug）";
        }

        // 合并多个swapper
        if (this.options.multi) {
            props.multi = true;
            welcomeMsg += "（）";
        }

        this.log(yosay(welcomeMsg));

        if (this.options.url) {
            props.url = this.options.url;
        } else {
            prompts.push({
                type: "input",
                name: "url",
                message:
                    "please input swagger url eg:http://localhost:8080/swagger-ui.html or http://localhost:8080//v2/api-docs",
                default: "http://localhost:8080/swagger-ui.html",
            });
        }

        if (this.options.className) {
            props.className = this.options.className;
        } else {
            prompts.push({
                type: "input",
                name: "className",
                message: "please enter nameSpaceName of the API",
                default: "$api",
            });
        }

        // if (this.options.outputFile) {
        //     props.outputFile = this.options.outputFile;
        // } else {
        //     prompts.push({
        //         type: "input",
        //         name: "outPutFile",
        //         message: "Please enter the API file name",
        //         default: "api.ts",
        //     });
        // }

        if (prompts.length) {
            return this.prompt(prompts).then((_props) => {
                this.props = Object.assign(props, _props);
            });
        }

        this.props = props;
        return this;
    }

    // 生成文件阶段钩子
    writing() {
        let { url, className, debug, multi } = this.props;
        let urls = [];

        if (multi) {
            try {
                let json = require(url);
                json.swagger.forEach((s) => {
                    urls.push({
                        ...s,
                        url: getSwaggerJson(s.url),
                    });
                });
            } catch (e) {
                console.log(e);
            }
        } else {
            urls.push({
                url: getSwaggerJson(url),
            });
        }

        if (!urls.length) return;

        let actions = urls.map((swagger) => {
            return new Promise((resolve) => {
                axios.get(swagger.url).then((res) => {
                    resolve({
                        ...swagger,
                        data: res.data,
                    });
                });
            });
        });

        Promise.all(actions)
            .then((responses) => {
                let swaggerData = [];
                responses.forEach((res) => {
                    swaggerData.push(
                        codegen.getViewForSwagger({
                            ...res,
                            swagger: res.data,
                            className,
                        })
                    );
                });

                // 输出目录路径
                this.fs.copyTpl(this.templatePath("apis.d.ejs"), this.destinationPath("api.d.ts"), { swaggerData });
                this.fs.copyTpl(this.templatePath("apis.ejs"), this.destinationPath("api.js"), { swaggerData });

                if (debug) {
                    console.log("debug模式：输出转译文件");
                    this.fs.write(
                        // 参数 绝对路径 内容
                        this.destinationPath("swaggerData.json"),
                        JSON.stringify(swaggerData)
                    );
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }
};
