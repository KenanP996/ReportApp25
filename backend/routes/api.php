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

registerCrudRoutes('users', 'dao.users');
registerCrudRoutes('teams', 'dao.teams');
registerCrudRoutes('companies', 'dao.companies');
registerCrudRoutes('reports', 'dao.reports');
registerCrudRoutes('pickups', 'dao.pickups');

function registerCrudRoutes(string $resource, string $daoKey): void
{
    Flight::route(sprintf('GET /api/%s', $resource), static function () use ($daoKey) {
        $dao = Flight::get($daoKey);
        Flight::json($dao->all());
    });

    Flight::route(sprintf('GET /api/%s/@id:[0-9]+', $resource), static function (int $id) use ($daoKey, $resource) {
        $dao = Flight::get($daoKey);
        $entity = $dao->find($id);

        if ($entity === null) {
            respondNotFound($resource, $id);
        }

        Flight::json($entity);
    });

    Flight::route(sprintf('POST /api/%s', $resource), static function () use ($daoKey) {
        $dao = Flight::get($daoKey);
        $payload = getJsonPayload();

        try {
            $created = $dao->create($payload);
            Flight::json($created, 201);
        } catch (Throwable $throwable) {
            respondWithError($throwable);
        }
    });

    $updateHandler = static function (int $id) use ($daoKey, $resource) {
        $dao = Flight::get($daoKey);
        $payload = getJsonPayload();

        try {
            $updated = $dao->update($id, $payload);

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

    Flight::route(sprintf('DELETE /api/%s/@id:[0-9]+', $resource), static function (int $id) use ($daoKey, $resource) {
        $dao = Flight::get($daoKey);
        $existing = $dao->find($id);

        if ($existing === null) {
            respondNotFound($resource, $id);
        }

        $dao->delete($id);

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
