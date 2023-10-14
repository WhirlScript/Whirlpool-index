#!/bin/env node
"use strict";

const fs = require('fs');
const axios = require('axios');


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

const packages = JSON.parse(fs.readFileSync('../packages.json').toString());


async function getRepoInf(url) {
    const hub = {
        github: 'github.com',
        gitlab: 'gitlab.com'
    }  //定义这些托管服务

    for (let i in hub) {
        const re = new RegExp(`https://${hub[i]}/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+`);
        if(re.test(url)) {
            const repoPath = url.split(`https://${hub[i]}/`)[1];
            switch (i) {
                case 'github':
                    // do sth
                    console.log('获取githubAPI')
                    console.log(`https://api.${hub[i]}/repos/${repoPath}`)
                    //console.log((await axios.get(`https://api.${hub[i]}/repos/${repoPath}/git/refs/tags`)).data);
                    // 获取最新tag的提交
                    console.log('api获取...');
                    const apiRes = (await axios.get(`https://api.${hub[i]}/repos/${repoPath}/git/refs/tags`)).data;
                    console.log('api获取完毕');
                    const sha = apiRes[apiRes.length - 1].object.sha;
                    
                    console.log('raw获取...');
                    const rawRes = (await axios.get(`https://${hub[i]}/${repoPath}/raw/${sha}/whirlpool.json`)).data;
                    console.log('raw获取完毕');
                    const raw = JSON.parse(rawRes);
                    
                    let data = {
                        repo: url,
                        version: raw.version,
                        sha: sha
                    }
                    console.debug(res);
                    return data;
                case 'gitlab':
                    //do sth
                    return null;
            }
            break;
        }  // 判断是否是github的url
        return null;
    }

    
    
}


for (let i in packages) {
    const fileName = `../bucket/${i}.json`;
    // 如果这是一个新的包的话:
    if (!fs.existsSync(fileName)) {
        console.warn(`新的包被写入了：${i}`)
        let packagesInf = JSON.parse(JSON.stringify(defaultInf));  // 将JSON拷贝
        getRepoInf(packages[i]).then(resolveCallback => {
            // 生成json数据
            packagesInf.name = i;
            packagesInf.repo = resolveCallback.repo;
            packagesInf.versions[0].version = resolveCallback.version;
            packagesInf.versions[0].sha1 = resolveCallback.sha;

            console.log(`${resolveCallback.version} ${resolveCallback.sha}`)
            // 写入文件
            fs.writeFileSync(`../bucket/${fileName}`, JSON.stringify(packagesInf));
            }
        );
        

    }
}