import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import postcssPresetEnv from "postcss-preset-env"

const veOrigin = 'http://123.121.147.7:88'

const buildVeReferer = (url = '') => {
  const requestUrl = new URL(url, 'http://localhost')
  const veRootUrl = `${veOrigin}/ve`
  const coursePlatformUrl = `${veOrigin}/ve/back/coursePlatform/coursePlatform.shtml`

  const isCourseResource = requestUrl.pathname.endsWith('/back/coursePlatform/courseResource.shtml')
  const isFilePlayUrl = requestUrl.pathname.endsWith('/back/coursePlatform/dataSynAction.shtml')
    && requestUrl.searchParams.get('method') === 'getFilePlayUrl'

  if (isCourseResource || isFilePlayUrl) {
    return veRootUrl
  }

  return coursePlatformUrl
}

// https://vite.dev/config/
export default defineConfig({
  css: {
    postcss: {
      plugins: [postcssPresetEnv()]
    }
  },
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api_server1936': {
        target: 'http://123.121.147.7:1936',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api_server1936/, ''),
        // 如果需要处理cookie可以添加：
        cookieDomainRewrite: "localhost",
        cookiePathRewrite: {
          '/api_server1936': '/api_server1936'
        }
      },
      '/api_app': {
        target: 'http://123.121.147.7:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api_app/, ''),
        // 如果需要处理cookie可以添加：
        cookieDomainRewrite: "localhost",
        cookiePathRewrite: {
          '/app': '/api_app'
        }
      },
      '/api_mis': {
        target: 'https://mis.bjtu.edu.cn',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api_mis/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
          });
        },
        cookieDomainRewrite: "localhost",
        cookiePathRewrite: {
          '^/': '/api_mis/'
        }
      },
      '/api_cas': {
        target: 'https://cas.bjtu.edu.cn',
        changeOrigin: true,
        secure: false, // 允许HTTPS代理
        rewrite: (path) => path.replace(/^\/api_cas/, ''),
        headers: {
          Host: 'cas.bjtu.edu.cn',
          Origin: 'https://cas.bjtu.edu.cn'
        },
        // 保持cookie设置
        cookieDomainRewrite: "localhost",

      },
      '/api_ai': {
        target: 'https://aiservice.bjtu.edu.cn',
        changeOrigin: true,
        secure: false, // 允许HTTPS代理
        rewrite: (path) => path.replace(/^\/api_ai/, ''),
        headers: {
          Host: 'aiservice.bjtu.edu.cn',
          Origin: 'https://aiservice.bjtu.edu.cn'
        },
        cookieDomainRewrite: "localhost",
      },
      '/api_weiyun': {
        target: 'https://sharechain.qq.com',
        changeOrigin: true,
        secure: false, // 允许HTTPS代理
        rewrite: (path) => path.replace(/^\/api_weiyun/, ''),
        headers: {
          Host: 'sharechain.qq.com',
          Origin: 'https://share.weiyun.com'
        },
        cookieDomainRewrite: "localhost",
      },
      '/api': {
        target: 'http://123.121.147.7:88/ve',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.setHeader('Origin', veOrigin);
            proxyReq.setHeader('Referer', buildVeReferer(req.url));
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            if (proxyRes.statusCode === 302) {
              proxyRes.statusCode = 200;
            }
          });
        },
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false, // 若目标服务器使用https证书不受信任时需要
        headers: {
          Host: '123.121.147.7:88',
          Origin: veOrigin,
          Referer: `${veOrigin}/ve/back/coursePlatform/coursePlatform.shtml`
        },
        cookieDomainRewrite: "localhost",
        cookiePathRewrite: {
          '/ve/': '/api'  // 将 Cookie 路径从 /ve 映射到 /api
        }
      },
    }
  }
})
