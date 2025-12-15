<?php

declare(strict_types=1);

Flight::route('GET /health', static function () {
    Flight::json([
        'status' => 'ok',
        'app' => Flight::get('config')['appName'],
        'version' => Flight::get('config')['version'],
    ]);
});

Flight::route('GET /', static function () {
    Flight::render('home', [
        'app' => Flight::get('config')['appName'],
        'version' => Flight::get('config')['version'],
    ]);
});

Flight::route('GET /docs', static function () {
    Flight::render('swagger');
});

Flight::route('GET /docs/openapi.yaml', static function () {
    $path = __DIR__ . '/../../docs/openapi.yaml';
    if (!file_exists($path)) {
        Flight::halt(404, 'OpenAPI spec not found');
    }
    header('Content-Type: application/x-yaml');
    readfile($path);
});

Flight::route('POST /api/auth/register', static function () {
    $service = Flight::get('service.users');
    $payload = getJsonPayload();
    $payload['role'] = 'team_lead'; // public registration is limited to team leads

    try {
        $created = $service->create($payload);
        $token = issueToken($created);
        Flight::json(['token' => $token, 'user' => $created], 201);
    } catch (Throwable $throwable) {
        respondWithError($throwable);
    }
});

Flight::route('POST /api/auth/login', static function () {
    $payload = getJsonPayload();
    $email = $payload['email'] ?? null;
    $password = $payload['password'] ?? null;

    if (!is_string($email) || !is_string($password)) {
        Flight::halt(400, json_encode(['error' => 'Email and password are required']));
    }

    /** @var \ReportApp25\Services\UserService $service */
    $service = Flight::get('service.users');
    $userWithPassword = $service->findWithPassword($email);

    if ($userWithPassword === null || !password_verify($password, $userWithPassword['password_hash'])) {
        Flight::halt(401, json_encode(['error' => 'Invalid credentials']));
    }

    unset($userWithPassword['password_hash']);

    $token = issueToken($userWithPassword);
    Flight::json(['token' => $token, 'user' => $userWithPassword]);
});

Flight::route('GET /api/auth/me', static function () {
    $user = requireAuth();
    Flight::json(['user' => $user]);
});

registerCrudRoutes('users', 'service.users');
registerCrudRoutes('teams', 'service.teams');
registerCrudRoutes('companies', 'service.companies');
registerCrudRoutes('reports', 'service.reports');
registerCrudRoutes('pickups', 'service.pickups');
registerCrudRoutes('team-applications', 'service.team_applications');

function registerCrudRoutes(string $resource, string $serviceKey): void
{
    Flight::route(sprintf('GET /api/%s', $resource), static function () use ($serviceKey) {
        requireAuth();
        $service = Flight::get($serviceKey);
        Flight::json($service->all());
    });

    Flight::route(sprintf('GET /api/%s/@id:[0-9]+', $resource), static function (int $id) use ($serviceKey, $resource) {
        requireAuth();
        $service = Flight::get($serviceKey);
        $entity = $service->find($id);

        if ($entity === null) {
            respondNotFound($resource, $id);
        }

        Flight::json($entity);
    });

    Flight::route(sprintf('POST /api/%s', $resource), static function () use ($serviceKey) {
        // Allow managers and team leads to create
        requireRole(['manager', 'team_lead']);
        $service = Flight::get($serviceKey);
        $payload = getJsonPayload();

        try {
            $created = $service->create($payload);
            Flight::json($created, 201);
        } catch (Throwable $throwable) {
            respondWithError($throwable);
        }
    });

    $updateHandler = static function (int $id) use ($serviceKey, $resource) {
        // Allow managers and team leads to update
        requireRole(['manager', 'team_lead']);
        $service = Flight::get($serviceKey);
        $payload = getJsonPayload();

        try {
            $updated = $service->update($id, $payload);

            if ($updated === null) {
                respondNotFound($resource, $id);
            }

            Flight::json($updated);
        } catch (Throwable $throwable) {
            respondWithError($throwable);
        }
    };

    Flight::route(sprintf('PUT /api/%s/@id:[0-9]+', $resource), $updateHandler);
    Flight::route(sprintf('PATCH /api/%s/@id:[0-9]+', $resource), $updateHandler);

    Flight::route(sprintf('DELETE /api/%s/@id:[0-9]+', $resource), static function (int $id) use ($serviceKey, $resource) {
        // Allow managers and team leads to delete
        requireRole(['manager', 'team_lead']);
        $service = Flight::get($serviceKey);
        $existing = $service->find($id);

        if ($existing === null) {
            respondNotFound($resource, $id);
        }

        $service->delete($id);

        Flight::json(['status' => 'deleted']);
    });
}

function getJsonPayload(): array
{
    $raw = Flight::request()->getBody();

    if ($raw === '' || $raw === null) {
        return [];
    }

    $decoded = json_decode($raw, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        Flight::halt(400, json_encode([
            'error' => 'Invalid JSON payload',
            'details' => json_last_error_msg(),
        ]));
    }

    return $decoded;
}

function respondNotFound(string $resource, int $id): void
{
    Flight::response()->header('Content-Type', 'application/json');
    Flight::halt(404, json_encode([
        'error' => sprintf('%s with id %d not found', ucfirst(rtrim($resource, 's')), $id),
    ]));
}

function respondWithError(Throwable $throwable): void
{
    $status = $throwable instanceof InvalidArgumentException ? 400 : 500;

    Flight::response()->header('Content-Type', 'application/json');
    Flight::halt($status, json_encode([
        'error' => $throwable->getMessage(),
    ]));
}
