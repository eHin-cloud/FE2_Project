<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => ['message' => 'Method not allowed']]);
    exit;
}

$apiKey = getenv('GEMINI_API_KEY') ?: '';
$localConfigPath = __DIR__ . '/.env.php';
if ($apiKey === '' && is_file($localConfigPath)) {
    $localConfig = require $localConfigPath;
    if (is_array($localConfig) && !empty($localConfig['GEMINI_API_KEY'])) {
        $apiKey = (string) $localConfig['GEMINI_API_KEY'];
    }
}

$apiKey = trim($apiKey);
if ($apiKey === '') {
    http_response_code(500);
    echo json_encode(['error' => ['message' => 'Gemini API key is not configured on the server']]);
    exit;
}

$rawBody = file_get_contents('php://input') ?: '';
if (strlen($rawBody) > 120000) {
    http_response_code(413);
    echo json_encode(['error' => ['message' => 'Request is too large']]);
    exit;
}

$payload = json_decode($rawBody, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => ['message' => 'Invalid JSON payload']]);
    exit;
}

$contents = $payload['contents'] ?? null;
$systemInstruction = $payload['systemInstruction'] ?? null;
$generationConfig = $payload['generationConfig'] ?? null;
$modelCandidates = $payload['modelCandidates'] ?? ['gemini-2.5-flash', 'gemini-2.0-flash'];

if (!is_array($contents) || !is_array($systemInstruction) || !is_array($generationConfig) || !is_array($modelCandidates)) {
    http_response_code(400);
    echo json_encode(['error' => ['message' => 'Missing required Gemini request fields']]);
    exit;
}

$lastError = null;

foreach ($modelCandidates as $model) {
    if (!is_string($model) || !preg_match('/^gemini-[a-zA-Z0-9.\-]+$/', $model)) {
        continue;
    }

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent?key=' . rawurlencode($apiKey);
    $modelGenerationConfig = $generationConfig;
    if (strpos($model, '2.5') !== false) {
        $modelGenerationConfig['thinkingConfig'] = [
            'thinkingBudget' => 0,
        ];
    }

    $requestBody = json_encode([
        'contents' => $contents,
        'systemInstruction' => $systemInstruction,
        'generationConfig' => $modelGenerationConfig,
    ], JSON_UNESCAPED_UNICODE);

    $headers = [
        'Content-Type: application/json',
        'Accept: application/json',
    ];

    $responseBody = false;
    $statusCode = 0;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $requestBody,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 25,
        ]);
        $responseBody = curl_exec($ch);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($responseBody === false) {
            $lastError = curl_error($ch);
        }
        curl_close($ch);
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", $headers),
                'content' => $requestBody,
                'timeout' => 25,
                'ignore_errors' => true,
            ],
        ]);
        $responseBody = file_get_contents($url, false, $context);
        $statusLine = $http_response_header[0] ?? '';
        if (preg_match('/\s(\d{3})\s/', $statusLine, $matches)) {
            $statusCode = (int) $matches[1];
        }
        if ($responseBody === false) {
            $lastError = 'Failed to connect to Gemini API';
        }
    }

    if ($responseBody === false) {
        continue;
    }

    if ($statusCode >= 200 && $statusCode < 300) {
        http_response_code($statusCode);
        echo $responseBody;
        exit;
    }

    $lastError = $responseBody;
    if ($statusCode !== 404 && $statusCode !== 429) {
        http_response_code($statusCode ?: 502);
        echo $responseBody;
        exit;
    }
}

http_response_code(502);
echo json_encode([
    'error' => [
        'message' => 'No Gemini model responded successfully',
        'detail' => $lastError,
    ],
], JSON_UNESCAPED_UNICODE);
