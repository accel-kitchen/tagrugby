<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if (!function_exists('curl_init')) {
	http_response_code(500);
	echo json_encode(['error' => 'PHP cURL extension is required but not enabled.']);
	exit;
}

$apiKey = getenv('OPENAI_API_KEY');

if (!$apiKey) {
	$envPath = __DIR__ . '/.env';
	if (is_readable($envPath)) {
		$envValues = parse_ini_file($envPath, false, INI_SCANNER_RAW);
		if (isset($envValues['OPENAI_API_KEY'])) {
			$apiKey = trim((string)$envValues['OPENAI_API_KEY']);
		}
	}
}

if (!$apiKey) {
	http_response_code(500);
	echo json_encode(['error' => 'Missing OpenAI API key in environment or .env file']);
	exit;
}

$endpoint = 'https://api.openai.com/v1/models';

$ch = curl_init($endpoint);
curl_setopt_array($ch, [
	CURLOPT_RETURNTRANSFER => true,
	CURLOPT_HTTPHEADER => [
		'Content-Type: application/json',
		'Authorization: Bearer ' . $apiKey,
	],
]);

$response = curl_exec($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($response === false) {
	$error = curl_error($ch);
	curl_close($ch);
	http_response_code(502);
	echo json_encode(['error' => 'Failed to contact OpenAI', 'details' => $error]);
	exit;
}

curl_close($ch);

if ($httpStatus >= 400) {
	http_response_code($httpStatus);
	echo $response;
	exit;
}

$data = json_decode($response, true);

if (!is_array($data)) {
	http_response_code(500);
	echo json_encode(['error' => 'Unexpected response from OpenAI']);
	exit;
}

echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
