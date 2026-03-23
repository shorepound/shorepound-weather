<?php
// Simple PHP proxy for api.weather.gov
// Reads USER_AGENT and WEATHER_TARGET from environment (or .env if configured by host)
$target = getenv('WEATHER_TARGET') ?: 'https://api.weather.gov';
$user_agent = getenv('USER_AGENT') ?: 'shorepound01@gmail.com';

// Preserve path and query
$uri = $_SERVER['REQUEST_URI'];
$uri = preg_replace('#^/api#', '', $uri);
if ($uri === '') { $uri = '/'; }
$url = rtrim($target, '/') . $uri;

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Accept');
  http_response_code(204);
  exit;
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["User-Agent: $user_agent"]);
curl_setopt($ch, CURLOPT_HEADER, false);
// set timeout modestly
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE) ?: 502;
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'application/json';

if ($response === false) {
  http_response_code(502);
  header('Content-Type: application/json');
  echo json_encode(['error' => curl_error($ch)]);
  curl_close($ch);
  exit;
}

curl_close($ch);

header('Access-Control-Allow-Origin: *');
header('Content-Type: ' . $content_type);
http_response_code($http_code);
echo $response;
