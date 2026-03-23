<?php
// PHP proxy for NDBC (National Data Buoy Center) data
// Pass-through proxy: /ndbc/* -> https://www.ndbc.noaa.gov/*

$user_agent = getenv('USER_AGENT') ?: 'shorepound01@gmail.com';

$uri = $_SERVER['REQUEST_URI'];
// Strip /ndbc prefix
$path = preg_replace('#^/ndbc#', '', $uri);
if ($path === '' || $path === '/') { $path = '/'; }

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Accept');
  http_response_code(204);
  exit;
}

$url = 'https://www.ndbc.noaa.gov' . $path;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["User-Agent: $user_agent"]);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE) ?: 502;
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'text/plain';

if ($response === false) {
  http_response_code(502);
  header('Access-Control-Allow-Origin: *');
  header('Content-Type: application/json');
  echo json_encode(['error' => curl_error($ch)]);
  curl_close($ch);
  exit;
}
curl_close($ch);

header('Access-Control-Allow-Origin: *');
header('Content-Type: ' . $content_type);
header('Cache-Control: public, max-age=300');
http_response_code($http_code);
echo $response;
