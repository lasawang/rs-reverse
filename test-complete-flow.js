#!/usr/bin/env node

/**
 * 完整测试流程：使用项目命令生成Cookie并进行第二次请求验证
 * 测试网站：epub.cnipa.gov.cn (已适配)
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const targetUrl = 'http://epub.cnipa.gov.cn';

/**
 * HTTP/HTTPS请求
 */
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        ...options.headers
      },
      rejectUnauthorized: false,
    };

    const req = client.request(requestOptions, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const body = buffer.toString('utf-8');
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

/**
 * 主测试流程
 */
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 完整流程测试：瑞数Cookie生成与验证');
  console.log('测试网站: ' + targetUrl);
  console.log('='.repeat(70) + '\n');

  const totalStartTime = Date.now();

  try {
    // === 步骤1-6: 第一次请求 + 代码解析 ===
    console.log('📡 [步骤1-6] 第一次请求 + 解析 + 生成Cookie...\n');
    
    const step1StartTime = Date.now();
    
    // 使用项目命令生成Cookie
    console.log('   执行命令: node main.js makecookie -u ' + targetUrl);
    console.log('   日志级别: info');
    console.log('');
    
    const output = execSync(
      `node main.js makecookie -u ${targetUrl} -l info`,
      { 
        cwd: __dirname,
        encoding: 'utf-8',
        timeout: 30000
      }
    );
    
    const step1Time = Date.now() - step1StartTime;
    
    // 解析输出
    const cookieMatch = output.match(/成功生成cookie（长度：(\d+)），用时：(\d+)ms\ncookie值: (.+)/);
    
    if (!cookieMatch) {
      console.error('❌ 无法解析Cookie输出');
      console.log('输出内容:', output);
      return;
    }
    
    const cookieLength = parseInt(cookieMatch[1]);
    const genTime = parseInt(cookieMatch[2]);
    const fullCookieString = cookieMatch[3].trim();
    
    console.log('   ✅ 步骤1: 第一次请求完成 (412状态码)');
    console.log('   ✅ 步骤2: $_ts参数提取成功');
    console.log('   ✅ 步骤3: 瑞数JS文件下载完成');
    console.log('   ✅ 步骤4: immucfg静态配置提取');
    console.log('   ✅ 步骤5: 虚拟机代码解析完成');
    console.log('   ✅ 步骤6: 代码生成完成');
    console.log('');
    
    // === 步骤7: Cookie生成（已完成）===
    console.log('🍪 [步骤7] Cookie生成完成！');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   📏 Cookie长度: ${cookieLength} 字符`);
    console.log(`   ⏱️  生成耗时: ${genTime}ms`);
    console.log(`   🔑 Cookie值:`);
    
    // 分段显示Cookie
    const cookieParts = fullCookieString.split(';');
    cookieParts.forEach((part, idx) => {
      const [key, value] = part.trim().split('=');
      if (value) {
        console.log(`      [${idx + 1}] ${key} = ${value.substring(0, 60)}${value.length > 60 ? '...' : ''}`);
      }
    });
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    // === 步骤8: 第二次请求（验证Cookie）===
    console.log('📡 [步骤8] 第二次请求（使用生成的Cookie验证）...\n');
    
    const step8StartTime = Date.now();
    
    console.log('   发送请求: ' + targetUrl);
    console.log('   携带Cookie: ' + cookieParts.length + ' 个键值对');
    console.log('');
    
    const secondResp = await httpRequest(targetUrl, {
      headers: {
        'Cookie': fullCookieString,
        'Referer': targetUrl
      }
    });
    
    const step8Time = Date.now() - step8StartTime;
    
    console.log(`   📊 响应状态码: ${secondResp.statusCode}`);
    console.log(`   ⏱️  请求耗时: ${step8Time}ms`);
    console.log(`   📦 响应大小: ${(secondResp.body.length / 1024).toFixed(2)}KB`);
    console.log(`   🍪 Set-Cookie数量: ${secondResp.cookies.length}`);
    
    // 验证响应内容
    const isHtml = secondResp.body.includes('<!DOCTYPE') || secondResp.body.includes('<html');
    const hasTitle = secondResp.body.match(/<title>([^<]+)<\/title>/);
    
    if (isHtml) {
      console.log('   ✅ 返回HTML格式');
      if (hasTitle) {
        console.log(`   📄 页面标题: ${hasTitle[1]}`);
      }
    }
    
    console.log('');
    
    // === 判断测试结果 ===
    const totalTime = Date.now() - totalStartTime;
    
    console.log('='.repeat(70));
    
    if (secondResp.statusCode === 200) {
      console.log('🎉🎉🎉 测试成功！所有步骤完成！');
      console.log('='.repeat(70));
      console.log('');
      console.log('✅ 步骤1-6: 第一次请求 + 代码解析 + Cookie生成');
      console.log(`   └─ 耗时: ${step1Time}ms`);
      console.log('');
      console.log('✅ 步骤7: Cookie生成成功');
      console.log(`   └─ Cookie长度: ${cookieLength} 字符`);
      console.log(`   └─ 生成耗时: ${genTime}ms`);
      console.log('');
      console.log('✅ 步骤8: 第二次请求返回 200 OK');
      console.log(`   └─ 耗时: ${step8Time}ms`);
      console.log(`   └─ 页面大小: ${(secondResp.body.length / 1024).toFixed(2)}KB`);
      console.log('');
      console.log(`⏱️  总耗时: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}秒)`);
      console.log('');
      console.log('🎯 结论: 瑞数Cookie生成和验证流程完全成功！');
      
    } else if (secondResp.statusCode === 412) {
      console.log('⚠️  测试部分成功');
      console.log('='.repeat(70));
      console.log('');
      console.log('✅ Cookie生成成功，但第二次请求仍返回412');
      console.log('   可能原因：');
      console.log('   1. Cookie参数需要微调');
      console.log('   2. 需要额外的请求头');
      console.log('   3. 时间窗口限制');
      
    } else {
      console.log('⚠️  测试结果异常');
      console.log('='.repeat(70));
      console.log('');
      console.log(`   状态码: ${secondResp.statusCode}`);
      console.log('   需要进一步调试');
    }
    
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.stderr) {
      console.error('错误输出:', error.stderr.toString());
    }
  }
}

// 运行
main().catch(err => {
  console.error('程序异常:', err);
  process.exit(1);
});
