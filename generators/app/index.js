const Generator = require("yeoman-generator");
const yosay = require("yosay");
const codegen = require("../codegen");
const axios = require("axios");

module.exports = class extends (
    Generator
) {
    constructor(args, opts) {
        super(args, opts);
        this.option("babel"); // This method adds support for a `--babel` flag
    }

    prompting() {
        this.log(yosay(`欢迎使用 swagger to typescript schema`));

        let props = {};
        let prompts = [];

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
        let { url, className } = this.props;
        if (url.includes("swagger-ui.html")) {
            url = url.replace("swagger-ui.html", "v2/api-docs?group=Default");
        }
        // 请求swagger json文件
        axios.get(url).then((response) => {
            let swagger = response.data;
            let swaggerData = codegen.getViewForSwagger({
                swagger,
                className,
            });
            // 输出目录路径
            this.fs.copyTpl(this.templatePath("api.d.ejs"), this.destinationPath("api.d.ts"), swaggerData);
            this.fs.copyTpl(this.templatePath("api.ejs"), this.destinationPath("api.ts"), swaggerData);
        });
    }
};
