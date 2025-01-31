import { Hono } from 'hono'
import { currentConfig } from './config.ts'
import { get_doc_by_hpath } from './cache.ts'
import { htmlTemplate } from './htmlTemplate.ts'
import { renderHTML } from './render.ts'

export function createHonoApp() {
  const app = new Hono()
  app.use(async (_, next) => {
    console.log('请求到达')
    try {
      await next()
    } catch (error) {
      console.log(error)
    }
  })
  app.get('/', (c) => c.redirect('/index.html'))
  app.get('/assets/*', async (c) => {
    // TODO 处于安全考虑应该防范 file 跳出 assets
    const file = c.req.path
    const r = await fetch(`${currentConfig.value.apiPrefix}${file}`, {
      headers: {
        Authorization: `Token ${currentConfig.value.authorized}`,
      },
      method: 'GET',
    })

    if (!r.body) {
      return c.text('Not Found', 404, { 'Content-Type': 'text/plain' })
    }
    return c.stream(
      async (stream) => {
        const reader = r.body!.getReader()
        console.log(file)
        while (true) {
          const r = await reader.read()
          if (r.done) {
            stream.close()
            break
          } else {
            stream.write(r.value)
          }
        }
      },
      200,
      {
        'content-type': r.headers.get('content-type')!,
      },
    )
  })
  app.get('*', async (c) => {
    const path = decodeURIComponent(c.req.path)

    const r = await renderHtmlByPath(path).catch((err) => {
      console.log('err')

      return err.message
    })

    if (r instanceof Error) throw r
    return c.html(r)
  })
  return app
}

async function renderHtmlByPath(path: string): Promise<string | Error> {
  const hpath = decodeURIComponent(path)
    .replace(/\#(.*)?$/, '')
    .replace(/\.html$/, '')
  console.log(currentConfig.value)

  const doc = await get_doc_by_hpath(hpath)

  return await htmlTemplate(
    {
      title: doc.Properties?.title || '',
      htmlContent: await renderHTML(doc),
      level: path.split('/').length - 1 /** 最开头有一个 /  */,
    },
    {
      ...currentConfig.value.cdn,
      embedCode: currentConfig.value.embedCode,
    },
  )
}
