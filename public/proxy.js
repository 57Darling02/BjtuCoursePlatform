// proxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (req, res) => {
  let target = '';
  const headers = {};
  
  // 根据请求路径设置不同的代理规则
  if (req.url.startsWith('/api_server1936')) {
    target = 'http://123.121.147.7:1936';
    headers.Host = '123.121.147.7:1936';
  } else if (req.url.startsWith('/api_app')) {
    target = 'http://123.121.147.7:8081';
    headers.Host = '123.121.147.7:8081';
  } else if (req.url.startsWith('/api_mis')) {
    target = 'https://mis.bjtu.edu.cn';
    headers.Host = 'mis.bjtu.edu.cn';
  } else if (req.url.startsWith('/api_cas')) {
    target = 'https://cas.bjtu.edu.cn';
    headers.Host = 'cas.bjtu.edu.cn';
    headers.Origin = 'https://cas.bjtu.edu.cn';
  } else if (req.url.startsWith('/api')) {
    target = 'http://123.121.147.7:88/ve';
    headers.Host = '123.121.147.7:88';
    headers.Origin = 'https://123.121.147.7:88/ve';
  }

  // 创建代理中间件
  createProxyMiddleware({
    target,
    changeOrigin: true,
    secure: false,
    headers,
    pathRewrite: {
      '^/api_server1936': '',
      '^/api_app': '',
      '^/api_mis': '',
      '^/api_cas': '',
      '^/api': ''
    },
    cookieDomainRewrite: {
      '*': ''  // 清除域名限制
    },
    onProxyRes: (proxyRes) => {
      // 处理CAS和MIS的特殊跨域头
      const origin = req.headers.origin || '*';
      proxyRes.headers['access-control-allow-origin'] = origin;
      proxyRes.headers['access-control-allow-credentials'] = 'true';
      
      // 处理Cookie路径重写
      const cookies = proxyRes.headers['set-cookie'];
      if (cookies) {
        const newCookies = cookies.map(cookie => 
          cookie
            .replace(/Domain=[^;]+;/, '')
            .replace(/Path=\/ve\//, 'Path=/api/')
            .replace(/Path=\//, 'Path=/api_mis/')
        );
        proxyRes.headers['set-cookie'] = newCookies;
      }
    }
  })(req, res);
};