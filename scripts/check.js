#!/bin/env node
"use strict";

const fs = require('fs');
const axios = require('axios');
const { debug } = require('console');

const defaultInf = {
    name: null,
    repo: null,
    versions: [
        {
            version: null,
            dependencies: {},
            sha1: null
        }
    ]
}

// const packages = JSON.parse(fs.readFileSync('../packages.json').toString());

// 这个函数如果成功返回一个Object，不成功返回null
async function getRepoInf(name, url) {
    const re = new RegExp(`https://github.com/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+`);
    if (!re.test(url)) {
        return;
    }
    const repoPath = url.split(`https://github.com/`)[1];
    const filePath = `../bucket/${name}.json`;
    let hasNewVersion = null;

    console.log('获取githubAPI')
    console.log(`https://api.github.com/repos/${repoPath}`)
    //console.log((await axios.get(`https://api.github.com/repos/${repoPath}/git/refs/tags`)).data);
    // 获取最新tag的提交
    console.log('api获取...');
    const apiRes = (await axios.get(`https://api.github.com/repos/${repoPath}/git/refs/tags`)).data;
    console.log('api获取完毕');
    const sha = apiRes[apiRes.length - 1].object.sha;
    const currentVersion = apiRes[apiRes.length - 1].ref.split('refs/tags/')[1];
    //const currentVersion = '1.0.1';  // 4 debug
    const version = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)).versions[0].version : null;
    // 比对tags查看有无新版本
    console.log(`${currentVersion} => ${version}`)
    if (!/[0-9]+\.[0-9]+\.[0-9]+/.test(currentVersion)) {
        return null;
    }
    if (version && currentVersion !== version) {
        console.log('有新版本！');
        hasNewVersion = true;
    } else if (!version) {
        console.log('新的包！')
        hasNewVersion = false
    } else {
        console.log('无新版本')
        process.exit(0);
        return null;
    }

    console.log('raw获取...');
    const rawRes = (await axios.get(`https://github.com/${repoPath}/raw/${sha}/whirlpool.json`)).data;
    console.log('raw获取完毕');

    let data = {
        repo: url,
        version: rawRes.version,
        sha: sha,
    }
    //console.log(rawRes);
    if (rawRes.name !== name) {
        return null;
    }
    if (hasNewVersion) {
        // do sth
        
    } else {
        return data;
    }
}

module.exports = async function write2bucket(packName, fileName) {
    let packagesInf = JSON.parse(JSON.stringify(defaultInf));  // 将JSON拷贝
    const packages = JSON.parse(fs.readFileSync('../packages.json').toString());
    try {
        getRepoInf(packName, packages[packName]).then(resolveCallback => {
            // 生成json数据
            //console.debug(resolveCallback)
            packagesInf.name = packName;
            packagesInf.repo = resolveCallback.repo;
            packagesInf.versions[0].version = resolveCallback.version;
            packagesInf.versions[0].sha1 = resolveCallback.sha;
    
            console.log(`${resolveCallback.version} ${resolveCallback.sha}`)
            // 写入文件
            fs.writeFileSync(`../bucket/${fileName}`, JSON.stringify(packagesInf));
            }
        );
    } catch (e) {
        console.error(e);
    }
    
}
