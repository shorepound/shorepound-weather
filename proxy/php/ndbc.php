<?php
// PHP proxy for NDBC (National Data Buoy Center) data
// Routes:
//   /ndbc/activestations.xml  -> https://www.ndbc.noaa.gov/activestations.xml
//   /ndbc/station/{ID}        -> https://www.ndbc.noaa.gov/data/realtime2/{ID}.txt (latest line as JSON)
//   /ndbc/rss/{ID}            -> https://www.ndbc.noaa.gov/data/latest_obs/{ID}.rss
//   /ndbc/*                   -> proxy pass-through to https://www.ndbc.noaa.gov/*

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

// Route: /station/{ID} — fetch realtime2 txt data and return latest observation as JSON
if (preg_match('#^/station/([A-Za-z0-9]+)$#', $path, $m)) {
  $stationId = $m[1];
  $url = "https://www.ndbc.noaa.gov/data/realtime2/{$stationId}.txt";
  $raw = ndbc_fetch($url, $user_agent);
  if ($raw === false) {
    send_error(502, "Failed to fetch NDBC data for station $stationId");
    exit;
  }
  $json = parse_realtime2($raw, $stationId);
  header('Access-Control-Allow-Origin: *');
  header('Content-Type: application/json');
  header('Cache-Control: public, max-age=300');
  echo json_encode($json);
  exit;
}

// Default: proxy pass-through to ndbc.noaa.gov
$url = 'https://www.ndbc.noaa.gov' . $path;
$response = ndbc_fetch($url, $user_agent);
if ($response === false) {
  send_error(502, "Failed to fetch from NDBC");
  exit;
}
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=600');
// Guess content type from path
if (preg_match('/\.xml$/', $path)) {
  header('Content-Type: application/xml');
} elseif (preg_match('/\.rss$/', $path)) {
  header('Content-Type: application/rss+xml');
} elseif (preg_match('/\.txt$/', $path)) {
  header('Content-Type: text/plain');
} else {
  header('Content-Type: text/plain');
}
echo $response;
exit;

// ---- helpers ----

function ndbc_fetch(string $url, string $ua): string|false {
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, ["User-Agent: $ua"]);
  curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
  curl_setopt($ch, CURLOPT_TIMEOUT, 30);
  $result = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($result === false || $code >= 400) return false;
  return $result;
}

function send_error(int $code, string $msg): void {
  http_response_code($code);
  header('Access-Control-Allow-Origin: *');
  header('Content-Type: application/json');
  echo json_encode(['error' => $msg]);
}

/**
 * Parse NDBC realtime2 text data and return the latest observation as an associative array.
 */
function parse_realtime2(string $raw, string $stationId): array {
  $lines = explode("\n", trim($raw));
  if (count($lines) < 3) return ['error' => 'No data', 'station' => $stationId];

  // First line: header names (prefixed with #)
  $headerLine = ltrim($lines[0], '#');
  $headers = preg_split('/\s+/', trim($headerLine));

  // Second line: units (prefixed with #) — skip
  // Third line onward: data rows; take the first (most recent)
  $dataLine = $lines[2];
  $values = preg_split('/\s+/', trim($dataLine));

  $obs = ['station' => $stationId];
  for ($i = 0; $i < count($headers) && $i < count($values); $i++) {
    $key = $headers[$i];
    $val = $values[$i];
    // MM means missing
    $obs[$key] = ($val === 'MM') ? null : $val;
  }

  // Add computed fields
  if (isset($obs['WVHT']) && $obs['WVHT'] !== null) {
    $obs['waveHeightFt'] = round(floatval($obs['WVHT']) * 3.28084, 1);
  }
  if (isset($obs['WTMP']) && $obs['WTMP'] !== null) {
    $c = floatval($obs['WTMP']);
    $obs['waterTempF'] = round($c * 9 / 5 + 32, 1);
  }
  if (isset($obs['ATMP']) && $obs['ATMP'] !== null) {
    $c = floatval($obs['ATMP']);
    $obs['airTempF'] = round($c * 9 / 5 + 32, 1);
  }

  return $obs;
}
