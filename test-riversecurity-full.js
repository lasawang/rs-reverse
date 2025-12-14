#!/usr/bin/env node

/**
 * 完整测试riversecurity.com的Cookie生成和验证
 * 步骤7：生成Cookie
 * 步骤8：使用Cookie进行第二次请求，验证200状态码
 */

const https = require('https');
const { URL } = require('url');
const path = require('path');

// 允许旧版SSL协议
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 加载项目模块
require('module-alias')(path.dirname(require.resolve('./package.json')));
const { makeCookie } = require('./src/');
const gv = require('./src/handler/globalVarible');
const logger = require('./utils/logger');
const { getCode, getImmucfg } = require('./utils/');

// 设置日志级别
logger.level = 'info';  // 减少日志输出

const targetUrl = 'https://www.riversecurity.com/';

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
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        ...options.headers
      },
      rejectUnauthorized: false,
      secureOptions: require('crypto').constants.SSL_OP_LEGACY_SERVER_CONNECT,
    };

    const req = https.request(requestOptions, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        let body = buffer.toString('utf-8');
        
        // 处理gzip压缩
        if (res.headers['content-encoding'] === 'gzip') {
          const zlib = require('zlib');
          try {
            body = zlib.gunzipSync(buffer).toString('utf-8');
          } catch (e) {
            // 解压失败，使用原始内容
          }
        }
        
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
 * 提取$_ts
 */
function extractTsFromHtml(html) {
  // meta标签提取
  const metaMatch = html.match(/<meta[^>]+id=["']([^"']+)["'][^>]+content=["']([^"']+)["'][^>]+r=["']m["']/);
  if (metaMatch) {
    return { nsd: metaMatch[1], cd: metaMatch[2] };
  }
  
  // $_ts对象提取
  const tsMatch = html.match(/\$_ts\s*=\s*\{([^}]+)\}/);
  if (tsMatch) {
    const tsBlock = '{' + tsMatch[1] + '}';
    const nsdMatch = tsBlock.match(/['"]?nsd['"]?\s*:\s*['"]([^'"]+)['"]/);
    const cdMatch = tsBlock.match(/['"]?cd['"]?\s*:\s*['"]([^'"]+)['"]/);
    if (nsdMatch && cdMatch) {
      return { nsd: nsdMatch[1], cd: cdMatch[1] };
    }
  }
  
  return null;
}

/**
 * 提取JS URL
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
  console.log('\n' + '='.repeat(60));
  console.log('🚀 完整测试：riversecurity.com Cookie生成与验证');
  console.log('='.repeat(60) + '\n');

  try {
    // === 步骤1: 第一次请求 ===
    console.log('📡 [步骤1] 第一次请求（触发瑞数）...');
    const startTime1 = Date.now();
    const firstResp = await httpsRequest(targetUrl);
    const time1 = Date.now() - startTime1;
    
    console.log(`   ✅ 状态码: ${firstResp.statusCode}`);
    console.log(`   ⏱️  耗时: ${time1}ms`);
    
    if (firstResp.cookies.length > 0) {
      const serverCookie = firstResp.cookies[0].split(';')[0];
      console.log(`   🍪 服务器Cookie: ${serverCookie.substring(0, 80)}...`);
    }
    
    // === 步骤2-6: 解析和生成代码 ===
    console.log('\n🔧 [步骤2-6] 解析$_ts、下载JS、生成虚拟机代码...');
    const ts = extractTsFromHtml(firstResp.body);
    
    if (!ts) {
      console.error('   ❌ 无法提取 $_ts');
      return;
    }
    
    console.log(`   ✅ $_ts提取成功: nsd=${ts.nsd}, cd=${ts.cd.substring(0, 30)}...`);
    
    const jsUrls = extractJsUrls(firstResp.body, targetUrl);
    const rsJsUrl = jsUrls.find(url => {
      const filename = url.split('/').pop();
      return /^[a-zA-Z0-9]{8,}\.[a-f0-9]+\.js$/.test(filename);
    }) || jsUrls[0];
    
    console.log(`   📥 下载JS: ${rsJsUrl.split('/').pop()}`);
    
    const startTime2 = Date.now();
    const jsResp = await httpsRequest(rsJsUrl);
    const time2 = Date.now() - startTime2;
    
    if (jsResp.statusCode !== 200) {
      console.error('   ❌ JS下载失败');
      return;
    }
    
    console.log(`   ✅ JS下载成功 (${(jsResp.body.length / 1024).toFixed(1)}KB, ${time2}ms)`);
    
    // === 步骤7: 生成Cookie ===
    console.log('\n🍪 [步骤7] 生成Cookie...');
    
    const urlObj = new URL(targetUrl);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    
    // 配置argv
    gv._setAttr('argv', {
      mate: {
        url: urlObj,
        hostname,
        jscode: {
          name: rsJsUrl.split('/').pop(),
          code: jsResp.body
        },
      }
    });
    
    // 配置config
    require('./src/config/')(gv);
    
    // 生成Cookie
    const startTime7 = Date.now();
    const outputResolve = (...p) => path.resolve('./output/riversecurity-test', ...p);
    
    // 使用makeCookie
    const cookieValue = makeCookie(ts, outputResolve);
    const time7 = Date.now() - startTime7;
    
    console.log(`   ✅ Cookie生成成功！`);
    console.log(`   ⏱️  生成耗时: ${time7}ms`);
    console.log(`   📏 Cookie长度: ${cookieValue.length}`);
    console.log(`   🔑 Cookie值: ${cookieValue.substring(0, 100)}...`);
    
    // 获取完整Cookie字符串
    const cookieName = hostname.toUpperCase().replace(/\./g, '') + 'T';
    const serverCookie = firstResp.cookies.length > 0 ? firstResp.cookies[0].split(';')[0] : '';
    const fullCookie = serverCookie ? 
      `${serverCookie}; ${cookieName}=${cookieValue}` : 
      `${cookieName}=${cookieValue}`;
    
    console.log(`   📦 完整Cookie键值对数: ${fullCookie.split(';').length}`);
    
    // === 步骤8: 第二次请求（验证Cookie）===
    console.log('\n📡 [步骤8] 第二次请求（使用生成的Cookie）...');
    
    const startTime8 = Date.now();
    const secondResp = await httpsRequest(targetUrl, {
      headers: {
        'Cookie': fullCookie,
        'Referer': targetUrl
      }
    });
    const time8 = Date.now() - startTime8;
    
    console.log(`   ⏱️  请求耗时: ${time8}ms`);
    console.log(`   📊 响应状态码: ${secondResp.statusCode}`);
    console.log(`   📦 响应大小: ${(secondResp.body.length / 1024).toFixed(1)}KB`);
    
    if (secondResp.statusCode === 200) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉🎉🎉 测试成功！Cookie验证通过！');
      console.log('='.repeat(60));
      
      // 验证页面内容
      if (secondResp.body.includes('<!DOCTYPE html>') || secondResp.body.includes('<html')) {
        console.log('✅ 返回正常HTML页面');
      }
      
      if (secondResp.body.includes('瑞数') || secondResp.body.includes('River')) {
        console.log('✅ 页面包含瑞数相关内容');
      }
      
    } else if (secondResp.statusCode === 412) {
      console.log('\n⚠️  仍然返回412，Cookie可能需要调整');
    } else {
      console.log(`\n⚠️  返回非预期状态码: ${secondResp.statusCode}`);
    }
    
    // === 总结 ===
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试总结');
    console.log('='.repeat(60));
    console.log(`✅ 步骤1 - 第一次请求: ${firstResp.statusCode} (${time1}ms)`);
    console.log(`✅ 步骤2-6 - 代码解析: 成功 (${time2}ms)`);
    console.log(`✅ 步骤7 - Cookie生成: 长度${cookieValue.length} (${time7}ms)`);
    console.log(`${secondResp.statusCode === 200 ? '✅' : '⚠️'} 步骤8 - 第二次请求: ${secondResp.statusCode} (${time8}ms)`);
    console.log(`⏱️  总耗时: ${time1 + time2 + time7 + time8}ms`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('详细错误:', error.stack);
  }
}

// 运行
main().catch(err => {
  console.error('程序异常:', err);
  process.exit(1);
});
