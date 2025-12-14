<?php

declare(strict_types=1);

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Flight;
use ReportApp25\Services\UserService;
use Throwable;

Flight::map('error', static function (Throwable $throwable): void {
    error_log(sprintf(
        '[%s] %s: %s',
        date('c'),
        $throwable::class,
        $throwable->getMessage()
    ));

    $status = method_exists($throwable, 'getCode') && (int) $throwable->getCode() >= 400
        ? (int) $throwable->getCode()
        : 500;

    Flight::response()->header('Content-Type', 'application/json');
    Flight::halt($status, json_encode([
        'error' => 'Server error',
        'message' => $throwable->getMessage(),
    ]));
});

Flight::before('start', static function (): void {
    $request = Flight::request();
    $method = strtoupper($request->method);
    $path = $request->url;

    error_log(sprintf('[Request] %s %s (%s)', $method, $path, $request->ip));

    if (in_array($method, ['POST', 'PUT', 'PATCH'], true) && str_starts_with($path, '/api/')) {
        $contentType = $request->headers['Content-Type'] ?? '';
        if (!str_contains($contentType, 'application/json')) {
            Flight::halt(415, json_encode([
                'error' => 'Unsupported Media Type',
                'message' => 'Requests must use application/json',
            ]));
        }
    }
});

/**
 * @return array<string, mixed>
 */
function requireAuth(): array
{
    $user = Flight::get('user');
    if (is_array($user)) {
        return $user;
    }

    $authHeader = Flight::request()->headers['Authorization'] ?? '';
    if (!preg_match('/Bearer\\s+(.*)$/i', $authHeader, $matches)) {
        Flight::halt(401, json_encode(['error' => 'Missing or invalid Authorization header']));
    }

    $token = trim($matches[1]);
    $config = Flight::get('config');

    try {
        $payload = JWT::decode($token, new Key($config['jwt']['secret'], 'HS256'));
    } catch (Throwable $throwable) {
        Flight::halt(401, json_encode(['error' => 'Invalid token', 'message' => $throwable->getMessage()]));
    }

    /** @var UserService $userService */
    $userService = Flight::get('service.users');
    $userRecord = $userService->find((int) $payload->sub);

    if ($userRecord === null) {
        Flight::halt(401, json_encode(['error' => 'User not found for token']));
    }

    Flight::set('user', $userRecord);

    return $userRecord;
}

function requireRole(array $allowedRoles): void
{
    $user = requireAuth();

    if (!in_array($user['role'] ?? null, $allowedRoles, true)) {
        Flight::halt(403, json_encode([
            'error' => 'Forbidden',
            'message' => 'You do not have permission to perform this action.',
        ]));
    }
}

function issueToken(array $user): string
{
    $config = Flight::get('config')['jwt'];
    $now = time();

    return JWT::encode([
        'iss' => $config['issuer'],
        'aud' => $config['issuer'],
        'iat' => $now,
        'nbf' => $now,
        'exp' => $now + $config['ttl'],
        'sub' => $user['id'],
        'email' => $user['email'] ?? '',
        'role' => $user['role'] ?? 'team_lead',
    ], $config['secret'], 'HS256');
}
