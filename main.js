import axios from "axios";
import Pl from "plweb";
import fs from "fs/promises"; // 引入文件系统模块(Promise版)
import path from "path";

const urllist = [
  "http://physics-api.turtlesim.com/Users",
  "http://physics-api-cn.turtlesim.com/Users",
  "http://nlm-api-cn.turtlesim.com/Users",
  "http://nlm-api.turtlesim.com/Users",
  "http://tu.netlogo.org",
  "http://tu.netlogo.org",
  "http://pl.turtlesim.com",
  "http://physics-api-cn.turtlesim.com/Contents"
];

const runP1Task = async () => {
    const startTime = Date.now();
    try {
        const user = new Pl.User(); 
        await user.user.login();
        // const re = await user.experiment.get("63c5e6a94906dcddc28e958e","Discussion");
        const duration = Date.now() - startTime;
        return { type: 'System', name: 'P1 (Login)', duration, status: 'Success' };
    } catch (error) {
        return { type: 'System', name: 'P1 (Login)', duration: Date.now() - startTime, status: 'Failed', error: error.message };
    }
}

const testUrlSpeed = async (url) => {
    const startTime = Date.now();
    try {
        const response = await axios.get(url, { timeout: 5000 });
        const endTime = Date.now();
        const duration = endTime - startTime;
        // 获取 content-length，如果不存在则为 0
        const contentLength = response.headers['content-length'] ? parseInt(response.headers['content-length'], 10) : 0;
        // 速度单位: bytes/ms * 1000 = bytes/sec
        const speed = contentLength > 0 ? (contentLength / duration) * 1000 : 0;
        
        return { type: 'Network', url, duration, speed, status: 'Success' };
    } catch (error) {
        return { type: 'Network', url, duration: Date.now() - startTime, speed: 0, status: 'Failed', error: error.message };
    }
};

// 格式化日志内容的函数
const formatLogEntry = (results) => {
    const now = new Date().toLocaleString();
    let logText = `========== Test Batch: ${now} ==========\n`;
    
    // 分离出 P1 结果和 URL 结果
    const p1Result = results.find(r => r.type === 'System');
    const urlResults = results.filter(r => r.type === 'Network');

    // 记录 P1
    if (p1Result) {
        logText += `[System Task] ${p1Result.name} | Status: ${p1Result.status} | Time: ${p1Result.duration}ms\n`;
        if (p1Result.error) logText += `  Error: ${p1Result.error}\n`;
    }
    logText += `--------------------------------------------------\n`;

    // 记录 URL (按速度倒序排列)
    urlResults.sort((a, b) => b.speed - a.speed);
    
    urlResults.forEach(r => {
        if (r.status === 'Success') {
            logText += `[URL] Time: ${r.duration.toString().padEnd(4)}ms | Speed: ${r.speed.toFixed(2).padEnd(9)} B/s | ${r.url}\n`;
        } else {
            logText += `[URL] Status: FAILED | Time: ${r.duration}ms | ${r.url} (Err: ${r.error})\n`;
        }
    });

    logText += `==================================================\n\n`;
    return logText;
};

// 主函数
const main = async () => {
    console.log("Starting concurrent tests...");
    const tasks = [
        runP1Task(),
        ...urllist.map(url => testUrlSpeed(url))
    ];

    try {
        const results = await Promise.all(tasks);
        const logContent = formatLogEntry(results);
        const logPath = path.join(process.cwd(), 'log.txt');
        await fs.appendFile(logPath, logContent, 'utf8');
        console.log("Tests completed. Results appended to log.txt");
        console.log(logContent); 

    } catch (err) {
        console.error("Critical Error in main execution:", err);
    }
}

main();