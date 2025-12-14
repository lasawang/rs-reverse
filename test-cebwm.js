#!/usr/bin/env node

/**
 * 测试 cebwm.com 网站的Cookie生成
 * 使用自定义的HTTP请求以支持旧版SSL
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
const cheerio = require('cheerio');

// 设置日志级别
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
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        ...options.headers
      },
      rejectUnauthorized: false, // 忽略SSL证书验证
      // 允许旧版SSL
      secureOptions: require('crypto').constants.SSL_OP_LEGACY_SERVER_CONNECT,
    };

    logger.debug('发起请求:', url);
    logger.debug('请求头:', JSON.stringify(requestOptions.headers, null, 2));

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        logger.debug('响应状态码:', res.statusCode);
        logger.debug('响应头:', JSON.stringify(res.headers, null, 2));
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });

    req.on('error', (error) => {
      logger.error('请求失败:', error.message);
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * 提取$_ts参数
 */
function extractTs(html) {
  logger.debug('开始解析HTML...');
  
  // 使用正则提取$_ts
  const tsMatch = html.match(/\$_ts\s*=\s*({[^}]+})/);
  if (!tsMatch) {
    logger.error('未找到 $_ts');
    return null;
  }
  
  try {
    // 提取nsd和cd
    const tsStr = tsMatch[1];
    const nsdMatch = tsStr.match(/nsd['"]\s*:\s*['"]([^'"]+)['"]/);
    const cdMatch = tsStr.match(/cd['"]\s*:\s*['"]([^'"]+)['"]/);
    
    if (!nsdMatch || !cdMatch) {
      logger.error('无法提取nsd或cd');
      return null;
    }
    
    const ts = {
      nsd: nsdMatch[1],
      cd: cdMatch[1]
    };
    
    logger.debug('提取的 $_ts:', JSON.stringify(ts, null, 2));
    return ts;
  } catch (err) {
    logger.error('解析 $_ts 失败:', err.message);
    return null;
  }
}

/**
 * 提取加密JS文件URL
 */
function extractJsUrl(html, baseUrl) {
  logger.debug('查找加密JS文件...');
  
  const $ = cheerio.load(html);
  const scripts = [];
  
  $('script[src]').each((i, elem) => {
    const src = $(elem).attr('src');
    if (src && src.includes('.js') && !src.startsWith('http')) {
      const fullUrl = new URL(src, baseUrl).href;
      scripts.push(fullUrl);
      logger.debug(`找到JS文件 [${i}]: ${fullUrl}`);
    }
  });
  
  // 找可能是瑞数的JS文件（通常是随机命名的）
  const rsJs = scripts.find(s => /[a-zA-Z0-9]{12,}\.[a-f0-9]+\.js/.test(s));
  if (rsJs) {
    logger.info('找到瑞数JS文件:', rsJs);
    return rsJs;
  }
  
  logger.warn('未找到明确的瑞数JS文件，返回第一个JS');
  return scripts[0];
}

/**
 * 主测试流程
 */
async function main() {
  console.log('========================================');
  console.log('🚀 开始测试 cebwm.com Cookie生成');
  console.log('========================================\n');

  try {
    // 第一次请求：获取$_ts
    console.log('📡 第1次请求: 获取 $_ts 参数...');
    const firstResponse = await httpsRequest(targetUrl);
    
    // 412是瑞数的特殊状态码，说明需要Cookie
    if (firstResponse.statusCode !== 200 && firstResponse.statusCode !== 204 && firstResponse.statusCode !== 412) {
      console.error('❌ 第一次请求失败，状态码:', firstResponse.statusCode);
      return;
    }
    
    console.log('✅ 第1次请求成功, 状态码:', firstResponse.statusCode);
    
    // 如果是412，说明检测到了瑞数
    if (firstResponse.statusCode === 412) {
      console.log('⚡ 检测到瑞数保护 (412状态码)');
      
      // 提取服务器返回的Cookie
      if (firstResponse.cookies.length > 0) {
        const serverCookie = firstResponse.cookies[0].split(';')[0];
        console.log('   服务器Cookie:', serverCookie);
      }
    }
    
    // 提取$_ts
    const ts = extractTs(firstResponse.body);
    if (!ts) {
      console.error('❌ 无法提取 $_ts');
      return;
    }
    
    console.log('✅ 成功提取 $_ts');
    console.log('   nsd:', ts.nsd.substring(0, 50) + '...');
    console.log('   cd:', ts.cd.substring(0, 50) + '...');
    
    // 提取JS文件
    const jsUrl = extractJsUrl(firstResponse.body, targetUrl);
    if (!jsUrl) {
      console.error('❌ 无法找到JS文件');
      return;
    }
    
    console.log('✅ 找到JS文件:', jsUrl);
    
    // 获取JS文件内容
    console.log('\n📡 下载JS文件...');
    const jsResponse = await httpsRequest(jsUrl);
    
    if (jsResponse.statusCode !== 200) {
      console.error('❌ JS文件下载失败');
      return;
    }
    
    console.log('✅ JS文件下载成功');
    
    // 使用项目的makecookie功能
    console.log('\n🔐 开始生成Cookie...');
    
    // 配置全局变量
    const hostname = new URL(targetUrl).hostname.replace(/^www\./, '');
    gv._setAttr('argv', {
      mate: {
        url: new URL(targetUrl),
        hostname,
        jscode: jsResponse.body,
      }
    });
    
    // 尝试生成cookie
    try {
      const outputResolve = (...p) => path.resolve('./output', ...p);
      const cookie = makeCookie(ts, outputResolve);
      
      console.log('✅ Cookie生成成功!');
      console.log('   Cookie长度:', cookie.length);
      console.log('   Cookie值:', cookie);
      
      // 第二次请求：使用生成的Cookie
      console.log('\n📡 第2次请求: 使用生成的Cookie访问...');
      
      const cookieHeader = `${hostname.toUpperCase().replace(/\./g, '')}T=${cookie}`;
      const secondResponse = await httpsRequest(targetUrl, {
        headers: {
          'Cookie': cookieHeader
        }
      });
      
      console.log('✅ 第2次请求完成');
      console.log('   状态码:', secondResponse.statusCode);
      
      if (secondResponse.statusCode === 200) {
        console.log('\n🎉 成功！Cookie验证通过，可以正常访问页面！');
      } else {
        console.log('\n⚠️  状态码不是200，可能Cookie无效或网站有其他验证');
      }
      
    } catch (cookieErr) {
      console.error('❌ Cookie生成失败:', cookieErr.message);
      logger.error('详细错误:', cookieErr.stack);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    logger.error('详细错误:', error.stack);
  }
  
  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

// 运行
main().catch(err => {
  console.error('程序异常:', err);
  process.exit(1);
});
