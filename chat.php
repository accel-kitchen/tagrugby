<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$apiKey = getenv('OPENAI_API_KEY');

if (!$apiKey) {
	$envPath = __DIR__ . '/.env';
	if (is_readable($envPath)) {
		$envValues = parse_ini_file($envPath, false, INI_SCANNER_RAW);
		if (isset($envValues['OPENAI_API_KEY'])) {
			$apiKey = trim($envValues['OPENAI_API_KEY']);
		}
	}
}

if (!$apiKey) {
	http_response_code(500);
	echo json_encode(['error' => 'Missing OpenAI API key in environment or .env file']);
	exit;
}

$payload = json_decode(file_get_contents('php://input') ?: '[]', true);
if (!is_array($payload)) {
	http_response_code(400);
	echo json_encode(['error' => 'Invalid JSON body']);
	exit;
}

$message = trim((string)($payload['message'] ?? ''));
$context = trim((string)($payload['context'] ?? ''));

if ($message === '') {
	http_response_code(422);
	echo json_encode(['error' => 'message is required']);
	exit;
}

$messages = [
	[
		'role' => 'system',
		'content' => 'You are a helpful assistant that supports Tag Rugby AI tuning tasks.',
	],
];

if ($context !== '') {
	$messages[] = [
		'role' => 'system',
		'content' => "Current AI code snippet:\n" . $context,
	];
}

$messages[] = [
	'role' => 'user',
	'content' => $message,
];

$model = 'gpt-5-codex';
$responsesModels = ['gpt-5-codex'];
$useResponsesEndpoint = in_array($model, $responsesModels, true);

if ($useResponsesEndpoint) {
	$requestPayload = [
		'model' => $model,
		'input' => $messages,
		'temperature' => 0.6,
	];
	$endpoint = 'https://api.openai.com/v1/responses';
} else {
	$requestPayload = [
		'model' => $model,
		'messages' => $messages,
		'temperature' => 0.6,
	];
	$endpoint = 'https://api.openai.com/v1/chat/completions';
}

$body = json_encode($requestPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if (!function_exists('curl_init')) {
	http_response_code(500);
	echo json_encode(['error' => 'PHP cURL extension is required but not enabled.']);
	exit;
}

$ch = curl_init($endpoint);
curl_setopt_array($ch, [
	CURLOPT_POST => true,
	CURLOPT_RETURNTRANSFER => true,
	CURLOPT_HTTPHEADER => [
		'Content-Type: application/json',
		'Authorization: Bearer ' . $apiKey,
	],
	CURLOPT_POSTFIELDS => $body,
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
$reply = '';

if ($useResponsesEndpoint) {
	$output = $data['output'] ?? [];
	foreach ($output as $item) {
		if (($item['role'] ?? '') !== 'assistant') {
			continue;
		}
		foreach ($item['content'] ?? [] as $content) {
			if (($content['type'] ?? '') === 'text') {
				$reply .= $content['text']['value'] ?? '';
			}
		}
	}
} else {
	$reply = $data['choices'][0]['message']['content'] ?? '';
}

echo json_encode(['reply' => $reply]);
