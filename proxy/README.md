# spweather proxy

This small Express app forwards `/api/*` requests to `https://api.weather.gov` and injects a `User-Agent` header (required by the API).

Deployment on DreamHost (Passenger / Node.js):

1. Create a subdomain for the proxy (e.g. `api.weather.shorepound.net`) in DreamHost panel and select Passenger (Node.js) for deployment.
2. Upload the `proxy/` folder contents to the subdomain's folder on DreamHost (via SFTP or `rsync`).
3. On the server, run `npm install --production` in the proxy folder.
4. Configure environment variables in DreamHost panel or via a `.env` file (or set USER_AGENT). Example:
   - `USER_AGENT=spweather/contact@shorepound.net`
   - `WEATHER_TARGET=https://api.weather.gov`
5. Restart the app using the DreamHost panel or by touching `tmp/restart.txt` if required by Passenger.

After deployment, point your frontend's production `environment.weatherApiBase` to `https://api.weather.shorepound.net/api` so client requests go through the proxy which will add the `User-Agent` header.
