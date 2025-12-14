#!/usr/bin/env node

/**
 * 测试 cebwm.com 网站的Cookie生成 v2
 * 完整流程：第一次412 -> 生成Cookie -> 第二次200
 */

const https = require('https');
const { URL } = require('url');
const path = require('path');
const fs = require('fs');

// 允许旧版SSL协议
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 加载项目模块
require('module-alias')(path.dirname(require.resolve('./package.json')));
const logger = require('./utils/logger');
const { getCode, getImmucfg } = require('./utils/');
const { makeCode, makeCookie } = require('./src/');
const gv = require('./src/handler/globalVarible');

// 设置日志级别为debug
logger.level = 'debug';

const targetUrl = 'https://www.cebwm.com/wealth/grlc/index.html';

/**
 * 自定义HTTPS请求（支持旧SSL）
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
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'identity',  // 不压缩，方便解析
        'Accept-Language': 'zh-CN,zh;q=0.9',
        ...options.headers
      },
      rejectUnauthorized: false,
      secureOptions: require('crypto').constants.SSL_OP_LEGACY_SERVER_CONNECT,
    };

    const req = https.request(requestOptions, (res) => {
      let data = Buffer.alloc(0);
      
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data.toString('utf-8'),
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
 * 从HTML中提取$_ts
 */
function extractTsFromHtml(html) {
  // 方法1: 从meta标签提取
  const metaMatch = html.match(/<meta[^>]+id=["']([^"']+)["'][^>]+content=["']([^"']+)["'][^>]+r=["']m["']/);
  if (metaMatch) {
    const nsd = metaMatch[1];  // meta的id就是nsd
    const cd = metaMatch[2];   // content就是cd
    console.log('   从meta标签提取');
    return { nsd, cd };
  }
  
  // 方法2: 从$_ts对象提取
  const tsMatch = html.match(/\$_ts\s*=\s*\{([^}]+)\}/);
  if (tsMatch) {
    const tsBlock = '{' + tsMatch[1] + '}';
    const nsdMatch = tsBlock.match(/['"]?nsd['"]?\s*:\s*['"]([^'"]+)['"]/);
    const cdMatch = tsBlock.match(/['"]?cd['"]?\s*:\s*['"]([^'"]+)['"]/);
    
    if (nsdMatch && cdMatch) {
      console.log('   从$_ts对象提取');
      return {
        nsd: nsdMatch[1],
        cd: cdMatch[1]
      };
    }
  }
  
  return null;
}

/**
 * 从HTML中提取JS文件URL
 */
function extractJsUrls(html, baseUrl) {
  const jsUrls = [];
  const scriptRegex = /<script[^>]+src=["']([^"']+\.js)["']/g;
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    const src = match[1];
    let fullUrl;
    
    if (src.startsWith('http')) {
      fullUrl = src;
    } else if (src.startsWith('//')) {
      fullUrl = 'https:' + src;
    } else if (src.startsWith('/')) {
      const base = new URL(baseUrl);
      fullUrl = `${base.protocol}//${base.host}${src}`;
    } else {
      fullUrl = new URL(src, baseUrl).href;
    }
    
    jsUrls.push(fullUrl);
  }
  
  return jsUrls;
}

/**
 * 主测试流程
 */
async function main() {
  console.log('\n========================================');
  console.log('🚀 测试 cebwm.com Cookie生成（Debug模式）');
  console.log('========================================\n');

  try {
    // === 第一次请求：触发瑞数，获取$_ts ===
    console.log('📡 [步骤1] 第一次请求（触发瑞数保护）...');
    const firstResp = await httpsRequest(targetUrl);
    
    console.log(`   状态码: ${firstResp.statusCode}`);
    console.log(`   Set-Cookie: ${firstResp.cookies.length > 0 ? firstResp.cookies[0].substring(0, 80) + '...' : '无'}`);
    
    if (firstResp.statusCode !== 412 && firstResp.statusCode !== 204) {
      console.log('⚠️  预期状态码412（瑞数保护），实际:', firstResp.statusCode);
    }
    
    // 保存服务器返回的Cookie
    let serverCookie = '';
    if (firstResp.cookies.length > 0) {
      serverCookie = firstResp.cookies[0].split(';')[0];
      console.log(`✅ 服务器Cookie: ${serverCookie}`);
    }
    
    // 解析HTML，提取$_ts
    console.log('\n🔍 [步骤2] 解析HTML，提取 $_ts...');
    const ts = extractTsFromHtml(firstResp.body);
    
    if (!ts) {
      console.error('❌ 无法提取 $_ts');
      console.log('HTML片段:', firstResp.body.substring(0, 500));
      return;
    }
    
    console.log('✅ 成功提取 $_ts:');
    console.log(`   nsd: ${ts.nsd.substring(0, 50)}... (长度: ${ts.nsd.length})`);
    console.log(`   cd: ${ts.cd.substring(0, 50)}... (长度: ${ts.cd.length})`);
    
    // 提取JS文件
    console.log('\n🔍 [步骤3] 查找瑞数JS文件...');
    const jsUrls = extractJsUrls(firstResp.body, targetUrl);
    console.log(`   找到 ${jsUrls.length} 个JS文件`);
    
    // 找瑞数特征的JS（通常是随机命名的）
    const rsJsUrl = jsUrls.find(url => {
      const filename = url.split('/').pop();
      return /^[a-zA-Z0-9]{8,}\.[a-f0-9]+\.js$/.test(filename);
    }) || jsUrls[0];
    
    if (!rsJsUrl) {
      console.error('❌ 未找到JS文件');
      return;
    }
    
    console.log('✅ 瑞数JS文件:', rsJsUrl);
    
    // 下载JS文件
    console.log('\n📥 [步骤4] 下载JS文件...');
    const jsResp = await httpsRequest(rsJsUrl);
    
    if (jsResp.statusCode !== 200) {
      console.error('❌ JS文件下载失败，状态码:', jsResp.statusCode);
      return;
    }
    
    console.log('✅ JS文件下载成功');
    console.log(`   大小: ${(jsResp.body.length / 1024).toFixed(2)} KB`);
    
    // 保存文件用于调试
    const outputDir = path.resolve('./output/test-cebwm');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(outputDir, 'ts.json'), JSON.stringify(ts, null, 2));
    fs.writeFileSync(path.join(outputDir, 'main.js'), jsResp.body);
    fs.writeFileSync(path.join(outputDir, 'index.html'), firstResp.body);
    console.log('   文件已保存到:', outputDir);
    
    // === 使用项目的makecode功能解析代码 ===
    console.log('\n🔧 [步骤5] 解析虚拟机代码...');
    
    const urlObj = new URL(targetUrl);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    
    // 提取immucfg（静态配置）
    console.log('   提取immucfg...');
    const immucfg = getImmucfg(jsResp.body);
    console.log('   immucfg提取完成');
    
    // 先设置argv（jscode需要包装成对象）
    gv._setAttr('argv', {
      mate: {
        url: urlObj,
        hostname,
        jscode: {
          name: 'berrCCR8OusE.2a95215.js',  // 从URL提取的文件名
          code: jsResp.body  // 包装成对象格式
        },
        immucfg,
      }
    });
    
    // 再配置config（会自动提取immucfg）
    const config = require('./src/config/')(gv);
    
    try {
      // 生成代码
      const outputResolve = (...p) => path.resolve(outputDir, ...p);
      makeCode(ts, outputResolve);
      console.log('✅ 代码解析成功');
      
    } catch (codeErr) {
      console.error('❌ 代码解析失败:', codeErr.message);
      logger.error(codeErr.stack);
      return;
    }
    
    // === 生成Cookie ===
    console.log('\n🍪 [步骤6] 生成客户端Cookie...');
    
    try {
      const cookie = makeCookie(ts, path.resolve(outputDir));
      console.log('✅ Cookie生成成功！');
      console.log(`   长度: ${cookie.length}`);
      console.log(`   值: ${cookie.substring(0, 100)}...`);
      
      // 构建完整Cookie字符串
      const cookieName = hostname.toUpperCase().replace(/\./g, '') + 'T';
      const fullCookie = serverCookie ? 
        `${serverCookie}; ${cookieName}=${cookie}` : 
        `${cookieName}=${cookie}`;
      
      console.log(`\n   完整Cookie: ${fullCookie.substring(0, 150)}...`);
      
      // === 第二次请求：使用生成的Cookie ===
      console.log('\n📡 [步骤7] 第二次请求（使用Cookie）...');
      
      const secondResp = await httpsRequest(targetUrl, {
        headers: {
          'Cookie': fullCookie
        }
      });
      
      console.log(`   状态码: ${secondResp.statusCode}`);
      
      if (secondResp.statusCode === 200) {
        console.log('\n🎉🎉🎉 成功！Cookie验证通过，可以正常访问页面！');
        console.log('   页面大小:', (secondResp.body.length / 1024).toFixed(2), 'KB');
        
        // 保存成功的页面
        fs.writeFileSync(path.join(outputDir, 'success.html'), secondResp.body);
        console.log('   成功页面已保存');
        
      } else if (secondResp.statusCode === 412) {
        console.log('\n⚠️  仍然返回412，Cookie可能无效或需要其他参数');
      } else {
        console.log(`\n⚠️  返回状态码 ${secondResp.statusCode}`);
      }
      
    } catch (cookieErr) {
      console.error('❌ Cookie生成失败:', cookieErr.message);
      logger.error(cookieErr.stack);
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    logger.error('详细错误:', error.stack);
  }
  
  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================\n');
}

// 运行
main().catch(err => {
  console.error('程序异常:', err);
  process.exit(1);
});
