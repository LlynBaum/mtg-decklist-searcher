import { fileURLToPath, URL } from 'node:url'
import http2 from 'node:http2'
import { execFile } from 'node:child_process'
import type { IncomingMessage, ServerResponse } from 'node:http'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const DEFAULT_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function fetchViaHttp2(
  origin: string,
  path: string,
  userAgent: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(origin)
    client.on('error', (err) => {
      client.close()
      reject(err)
    })

    const req = client.request({
      ':method': 'GET',
      ':path': path,
      'user-agent': userAgent,
      accept: 'application/json',
      'accept-language': 'en-US,en;q=0.9',
    })

    let status = 500
    const chunks: Buffer[] = []

    req.on('response', (headers) => {
      status = Number(headers[':status'] ?? 500)
    })

    req.on('data', (chunk: Buffer) => {
      chunks.push(Buffer.from(chunk))
    })

    req.on('end', () => {
      client.close()
      resolve({
        status,
        body: Buffer.concat(chunks).toString('utf-8'),
      })
    })

    req.on('error', (err) => {
      client.close()
      reject(err)
    })

    req.end()
  })
}

function fetchViaCurl(
  url: string,
  userAgent: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      'curl',
      [
        '-s',
        '-L',
        '-w',
        '\n__HTTP_STATUS__:%{http_code}',
        '-H',
        `User-Agent: ${userAgent}`,
        '-H',
        'Accept: application/json',
        url,
      ],
      { maxBuffer: 25 * 1024 * 1024 },
      (err, stdout) => {
        if (err) {
          reject(err)
          return
        }
        const marker = '\n__HTTP_STATUS__:'
        const idx = stdout.lastIndexOf(marker)
        if (idx === -1) {
          resolve({ status: 200, body: stdout })
          return
        }
        const body = stdout.slice(0, idx)
        const statusStr = stdout.slice(idx + marker.length).trim()
        const status = Number(statusStr) || 200
        resolve({ status, body })
      }
    )
  })
}

function moxfieldCorsProxyPlugin(): Plugin {
  const handleMiddleware = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ) => {
    const rawUrl = req.url ?? ''
    if (!rawUrl.startsWith('/v2/') && !rawUrl.startsWith('/v3/')) {
      next()
      return
    }

    const userAgent =
      typeof req.headers['user-agent'] === 'string' && req.headers['user-agent']
        ? req.headers['user-agent']
        : DEFAULT_UA

    const targetOrigin = 'https://api2.moxfield.com'
    const targetUrl = `${targetOrigin}${rawUrl}`

    try {
      let result = await fetchViaHttp2(targetOrigin, rawUrl, userAgent)

      // If Cloudflare challenges Node's TLS fingerprint (403), fallback to system curl (HTTP/2 + OpenSSL)
      if (result.status === 403 || !result.body.trim().startsWith('{')) {
        result = await fetchViaCurl(targetUrl, userAgent)
      }

      res.statusCode = result.status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Access-Control-Allow-Origin', '*')
      if (result.body.trim().startsWith('{')) {
        res.end(result.body)
      } else {
        res.end(
          JSON.stringify({
            status: result.status,
            error: `Moxfield API returned status ${result.status}`,
          })
        )
      }
    } catch (error) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          status: 502,
          error: error instanceof Error ? error.message : 'Failed to proxy Moxfield request',
        })
      )
    }
  }

  return {
    name: 'moxfield-cors-proxy',
    configureServer(server) {
      server.middlewares.use('/api/moxfield', handleMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/moxfield', handleMiddleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), moxfieldCorsProxyPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'moxfield-api': fileURLToPath(
        new URL('./node_modules/moxfield-api/dist/moxfield-api.mjs', import.meta.url)
      ),
    },
  },
})
