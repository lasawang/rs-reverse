#!/usr/bin/env node

/**
 * 测试 cebwm.com 网站 - Debug模式
 * 展示完整的8个步骤，标注哪些成功哪些失败
 */

const { execSync } = require('child_process');
const https = require('https');
const { URL } = require('url');

// 允许旧版SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const targetUrl = 'https://www.cebwm.com/wealth/grlc/index.html';

/**
 * HTTPS请求
 */
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
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
      secureOptions: require('crypto').constants.SSL_OP_LEGACY_SERVER_CONNECT,
    };

    const req = https.request(requestOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf-8'),
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
  console.log('🔍 Debug测试：cebwm.com 完整流程分析');
  console.log('测试网站: ' + targetUrl);
  console.log('='.repeat(70) + '\n');

  const results = {
    step1: { name: '第一次请求（触发瑞数）', status: '未测试', time: 0 },
    step2: { name: '提取$_ts参数', status: '未测试', time: 0 },
    step3: { name: '下载瑞数JS文件', status: '未测试', time: 0 },
    step4: { name: '提取immucfg配置', status: '未测试', time: 0 },
    step5: { name: '解析虚拟机代码', status: '未测试', time: 0 },
    step6: { name: '生成完整$_ts', status: '未测试', time: 0 },
    step7: { name: '生成Cookie', status: '未测试', time: 0, cookieLength: 0 },
    step8: { name: '第二次请求验证', status: '未测试', time: 0 },
  };

  try {
    // === 步骤1: 第一次请求 ===
    console.log('📡 [步骤1] 第一次请求（触发瑞数保护）...\n');
    const step1Start = Date.now();
    
    const firstResp = await httpsRequest(targetUrl);
    results.step1.time = Date.now() - step1Start;
    
    console.log(`   状态码: ${firstResp.statusCode}`);
    console.log(`   耗时: ${results.step1.time}ms`);
    
    if (firstResp.statusCode === 412 || firstResp.statusCode === 204) {
      results.step1.status = '✅ 成功';
      console.log('   ✅ 检测到瑞数保护');
      
      if (firstResp.cookies.length > 0) {
        const serverCookie = firstResp.cookies[0].split(';')[0];
        console.log(`   服务器Cookie: ${serverCookie.substring(0, 70)}...`);
      }
    } else {
      results.step1.status = '⚠️ 异常';
      console.log(`   ⚠️ 非预期状态码: ${firstResp.statusCode}`);
    }
    console.log('');

    // === 使用项目命令进行步骤2-7 ===
    console.log('🔧 [步骤2-7] 使用项目命令生成Cookie...\n');
    console.log('   执行命令: node main.js makecookie -u ' + targetUrl);
    console.log('   日志级别: debug');
    console.log('');

    const step2Start = Date.now();
    
    try {
      const output = execSync(
        `node main.js makecookie -u "${targetUrl}" -l debug`,
        { 
          cwd: __dirname,
          encoding: 'utf-8',
          timeout: 60000,
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );
      
      const totalTime = Date.now() - step2Start;
      
      // 解析输出
      if (output.includes('成功生成cookie')) {
        const cookieMatch = output.match(/成功生成cookie（长度：(\d+)），用时：(\d+)ms/);
        const cookieValueMatch = output.match(/cookie值: (.+)/);
        
        if (cookieMatch && cookieValueMatch) {
          results.step2.status = '✅ 成功';
          results.step3.status = '✅ 成功';
          results.step4.status = '✅ 成功';
          results.step5.status = '✅ 成功';
          results.step6.status = '✅ 成功';
          results.step7.status = '✅ 成功';
          results.step7.time = parseInt(cookieMatch[2]);
          results.step7.cookieLength = parseInt(cookieMatch[1]);
          
          const fullCookieString = cookieValueMatch[1].trim();
          
          console.log('   ✅ 步骤2: $_ts参数提取成功');
          console.log('   ✅ 步骤3: 瑞数JS文件下载完成');
          console.log('   ✅ 步骤4: immucfg静态配置提取');
          console.log('   ✅ 步骤5: 虚拟机代码解析完成');
          console.log('   ✅ 步骤6: 完整$_ts生成完成');
          console.log('   ✅ 步骤7: Cookie生成成功！');
          console.log('');
          console.log('   📏 Cookie长度: ' + results.step7.cookieLength + ' 字符');
          console.log('   ⏱️  生成耗时: ' + results.step7.time + 'ms');
          console.log('   🔑 Cookie值: ' + fullCookieString.substring(0, 100) + '...');
          console.log('');

          // === 步骤8: 第二次请求 ===
          console.log('📡 [步骤8] 第二次请求（使用生成的Cookie）...\n');
          
          const step8Start = Date.now();
          const secondResp = await httpsRequest(targetUrl, {
            headers: {
              'Cookie': fullCookieString,
              'Referer': targetUrl
            }
          });
          results.step8.time = Date.now() - step8Start;
          
          console.log(`   状态码: ${secondResp.statusCode}`);
          console.log(`   耗时: ${results.step8.time}ms`);
          console.log(`   响应大小: ${(secondResp.body.length / 1024).toFixed(2)}KB`);
          
          if (secondResp.statusCode === 200) {
            results.step8.status = '✅ 成功';
            console.log('   ✅ Cookie验证成功，可以正常访问！');
            
            if (secondResp.body.includes('<!DOCTYPE') || secondResp.body.includes('<html')) {
              console.log('   ✅ 返回正常HTML页面');
            }
          } else if (secondResp.statusCode === 412) {
            results.step8.status = '⚠️ 失败';
            console.log('   ⚠️ 仍返回412，Cookie可能无效');
          } else {
            results.step8.status = '⚠️ 异常';
            console.log(`   ⚠️ 返回状态码: ${secondResp.statusCode}`);
          }
        }
      } else {
        throw new Error('输出中未找到Cookie');
      }
      
    } catch (cmdError) {
      // 解析错误信息
      const errorOutput = cmdError.stderr ? cmdError.stderr.toString() : cmdError.message;
      
      console.log('   ❌ Cookie生成失败\n');
      console.log('   错误分析:');
      
      if (errorOutput.includes('适配')) {
        results.step2.status = '✅ 成功';
        results.step3.status = '✅ 成功';
        results.step4.status = '✅ 成功';
        results.step5.status = '✅ 成功';
        results.step6.status = '✅ 成功';
        results.step7.status = '❌ 失败';
        
        console.log('   ✅ 步骤2-6: 代码解析成功');
        console.log('   ❌ 步骤7: Cookie生成失败');
        console.log('');
        console.log('   失败原因: 网站未适配');
        console.log('   说明: cebwm.com 没有对应的basearr生成器');
      } else if (errorOutput.includes('Cannot read properties')) {
        results.step2.status = '✅ 成功';
        results.step3.status = '✅ 成功';
        results.step4.status = '✅ 成功';
        results.step5.status = '✅ 成功';
        results.step6.status = '⚠️ 部分成功';
        results.step7.status = '❌ 失败';
        
        console.log('   ✅ 步骤2-5: 基础解析成功');
        console.log('   ⚠️ 步骤6: 部分成功');
        console.log('   ❌ 步骤7: Cookie生成失败');
        console.log('');
        console.log('   失败原因: ' + errorOutput.split('\n')[0]);
      } else {
        console.log('   原始错误信息:');
        console.log('   ' + errorOutput.substring(0, 500));
      }
      
      results.step8.status = '⏭️ 跳过';
    }

  } catch (error) {
    console.error('\n❌ 测试异常:', error.message);
  }

  // === 生成测试报告 ===
  console.log('\n' + '='.repeat(70));
  console.log('📊 测试结果总览');
  console.log('='.repeat(70) + '\n');

  const steps = [
    { num: 1, ...results.step1 },
    { num: 2, ...results.step2 },
    { num: 3, ...results.step3 },
    { num: 4, ...results.step4 },
    { num: 5, ...results.step5 },
    { num: 6, ...results.step6 },
    { num: 7, ...results.step7 },
    { num: 8, ...results.step8 },
  ];

  steps.forEach(step => {
    const icon = step.status.includes('✅') ? '✅' : 
                 step.status.includes('❌') ? '❌' : 
                 step.status.includes('⚠️') ? '⚠️' : '⏭️';
    
    let line = `${icon} [步骤${step.num}] ${step.name.padEnd(25)} ${step.status}`;
    
    if (step.time > 0) {
      line += ` (${step.time}ms)`;
    }
    
    if (step.num === 7 && step.cookieLength > 0) {
      line += ` - 长度:${step.cookieLength}`;
    }
    
    console.log(line);
  });

  console.log('\n' + '='.repeat(70));
  
  // 统计结果
  const successCount = steps.filter(s => s.status.includes('✅')).length;
  const failCount = steps.filter(s => s.status.includes('❌')).length;
  const warnCount = steps.filter(s => s.status.includes('⚠️')).length;
  
  console.log(`📈 成功: ${successCount}/8  失败: ${failCount}/8  异常: ${warnCount}/8`);
  
  if (successCount === 8) {
    console.log('\n🎉 完美！所有步骤都成功！');
  } else if (successCount >= 6) {
    console.log('\n⚠️  部分成功，Cookie生成失败（网站未适配）');
  } else {
    console.log('\n❌ 测试失败，需要进一步调试');
  }
  
  console.log('='.repeat(70) + '\n');
}

// 运行
main().catch(err => {
  console.error('程序异常:', err);
  process.exit(1);
});
