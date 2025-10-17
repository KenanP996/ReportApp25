<?php

declare(strict_types=1);

use Flight;

Flight::route('GET /health', static function () {
    Flight::json([
        'status' => 'ok',
        'app' => Flight::get('config')['appName'],
        'version' => Flight::get('config')['version'],
    ]);
});

// Additional REST endpoints will be implemented in later milestones.
