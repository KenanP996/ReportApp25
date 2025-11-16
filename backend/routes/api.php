<?php

declare(strict_types=1);

use Flight;
use InvalidArgumentException;
use Throwable;

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

registerCrudRoutes('users', 'service.users');
registerCrudRoutes('teams', 'service.teams');
registerCrudRoutes('companies', 'service.companies');
registerCrudRoutes('reports', 'service.reports');
registerCrudRoutes('pickups', 'service.pickups');
registerCrudRoutes('team-applications', 'service.team_applications');

function registerCrudRoutes(string $resource, string $serviceKey): void
{
    Flight::route(sprintf('GET /api/%s', $resource), static function () use ($serviceKey) {
        $service = Flight::get($serviceKey);
        Flight::json($service->all());
    });

    Flight::route(sprintf('GET /api/%s/@id:[0-9]+', $resource), static function (int $id) use ($serviceKey, $resource) {
        $service = Flight::get($serviceKey);
        $entity = $service->find($id);

        if ($entity === null) {
            respondNotFound($resource, $id);
        }

        Flight::json($entity);
    });

    Flight::route(sprintf('POST /api/%s', $resource), static function () use ($serviceKey) {
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
