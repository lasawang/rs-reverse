/**
 * cebwm.com Cookie获取方案 - 使用 Puppeteer 浏览器自动化
 * 
 * 原因：cebwm.com 使用的瑞数版本与项目不兼容（$_ts.cd仅96字符）
 * 解决方案：通过浏览器自动完成瑞数加密，直接获取Cookie
 */

const puppeteer = require('puppeteer');
const https = require('https');

/**
 * 使用 Puppeteer 获取 cebwm.com 的瑞数 Cookie
 */
async function getCebwmCookie(url = 'https://www.cebwm.com/wealth/grlc/index.html') {
  console.log('🚀 启动浏览器自动化...');
  
  const browser = await puppeteer.launch({
    headless: true, // 无头模式
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors', // 忽略SSL证书错误
      '--disable-web-security'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // 设置User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    console.log(`📡 正在访问: ${url}`);
    
    // 第一次访问（触发瑞数）
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log(`📊 第一次请求状态码: ${response.status()}`);

    // 等待瑞数 JS 执行完成
    console.log('⏳ 等待瑞数加密完成 (3秒)...');
    await page.waitForTimeout(3000);

    // 获取所有 Cookies
    const cookies = await page.cookies();
    console.log(`🍪 获取到 ${cookies.length} 个 Cookie`);

    // 查找瑞数 Cookie（通常以特定前缀开头）
    const rsCookie = cookies.find(c => 
      c.name.startsWith('pXla') || 
      c.name.length > 10
    );

    if (rsCookie) {
      console.log(`✅ 找到瑞数 Cookie: ${rsCookie.name}`);
      console.log(`📏 Cookie 长度: ${rsCookie.value.length} 字符`);
      console.log(`🔑 Cookie 值: ${rsCookie.value}`);
      
      // 测试 Cookie 是否有效（第二次请求）
      console.log('\n🔄 测试 Cookie 有效性（第二次请求）...');
      const testResponse = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      console.log(`📊 第二次请求状态码: ${testResponse.status()}`);
      
      if (testResponse.status() === 200) {
        console.log('✅✅✅ Cookie 有效！第二次请求返回 200 OK');
      } else {
        console.log(`⚠️ Cookie 可能无效，状态码: ${testResponse.status()}`);
      }

      return {
        success: true,
        cookie: {
          name: rsCookie.name,
          value: rsCookie.value,
          domain: rsCookie.domain,
          path: rsCookie.path,
          expires: rsCookie.expires
        },
        cookieString: `${rsCookie.name}=${rsCookie.value}`,
        firstStatus: response.status(),
        secondStatus: testResponse.status(),
        allCookies: cookies
      };
    } else {
      console.log('❌ 未找到瑞数 Cookie');
      console.log('所有 Cookie:', cookies.map(c => c.name).join(', '));
      
      return {
        success: false,
        error: '未找到瑞数 Cookie',
        allCookies: cookies
      };
    }

  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
    console.log('🔒 浏览器已关闭');
  }
}

/**
 * 使用获取到的 Cookie 发起请求
 */
async function requestWithCookie(url, cookieString) {
  console.log('\n📡 使用 Cookie 发起请求...');
  
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Cookie': cookieString,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      },
      rejectUnauthorized: false // 忽略SSL错误
    };

    const req = https.request(url, options, (res) => {
      console.log(`📊 响应状态码: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 500) // 只保留前500字符
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  cebwm.com 瑞数 Cookie 获取工具 (Puppeteer 方案)        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const targetUrl = 'https://www.cebwm.com/wealth/grlc/index.html';

  // 获取 Cookie
  const result = await getCebwmCookie(targetUrl);

  if (result.success) {
    console.log('\n========================================');
    console.log('✅ Cookie 获取成功！');
    console.log('========================================');
    console.log(`Cookie 名称: ${result.cookie.name}`);
    console.log(`Cookie 长度: ${result.cookie.value.length} 字符`);
    console.log(`Cookie 字符串: ${result.cookieString}`);
    console.log(`第一次请求: ${result.firstStatus}`);
    console.log(`第二次请求: ${result.secondStatus}`);
    console.log('========================================\n');

    // 可选：使用 Cookie 发起额外请求
    // const testResult = await requestWithCookie(targetUrl, result.cookieString);
    // console.log('测试请求结果:', testResult);

  } else {
    console.log('\n========================================');
    console.log('❌ Cookie 获取失败');
    console.log('========================================');
    console.log(`错误: ${result.error}`);
    console.log('========================================\n');
  }

  return result;
}

// 执行主函数
if (require.main === module) {
  main()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 未捕获的错误:', error);
      process.exit(1);
    });
}

module.exports = {
  getCebwmCookie,
  requestWithCookie
};
