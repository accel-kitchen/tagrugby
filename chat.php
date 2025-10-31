<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	http_response_code(405);
	echo json_encode(['error' => 'Method not allowed']);
	exit;
}

$apiKey = getenv('OPENAI_API_KEY');
if (!$apiKey) {
	http_response_code(500);
	echo json_encode(['error' => 'Missing OpenAI API key in environment']);
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

$body = json_encode(
	[
		'model' => 'gpt-4o-mini',
		'messages' => $messages,
		'temperature' => 0.6,
	],
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);

$ch = curl_init('https://api.openai.com/v1/chat/completions');
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
$reply = $data['choices'][0]['message']['content'] ?? '';

echo json_encode(['reply' => $reply]);
