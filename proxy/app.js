const express = require('express');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
const morgan = require('morgan');
const app = express();

const TARGET = process.env.WEATHER_TARGET || 'https://api.weather.gov';
const USER_AGENT = process.env.USER_AGENT || 'spweather/contact@shorepound.net';

app.use(morgan('combined'));

app.use('/api/*', async (req, res) => {
  const upstream = TARGET + req.originalUrl.replace(/^\/api/, '');
  try {
    const headers = { Accept: 'application/geo+json', 'User-Agent': USER_AGENT };
    // copy allowed incoming headers
    if (req.headers['accept-language']) headers['Accept-Language'] = req.headers['accept-language'];

    const upstreamRes = await fetch(upstream, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
    });

    res.status(upstreamRes.status);
    upstreamRes.headers.forEach((v, k) => res.setHeader(k, v));
    upstreamRes.body.pipe(res);
  } catch (err) {
    console.error('Proxy error', err);
    res.status(502).send('Bad Gateway');
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Proxy listening on ${port}, forwarding to ${TARGET}`));
