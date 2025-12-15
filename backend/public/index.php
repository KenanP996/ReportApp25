<?php

declare(strict_types=1);

// Suppress deprecated notices from third-party libraries under PHP 8.x before autoload.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);

require_once __DIR__ . '/../vendor/autoload.php';

// Bootstrap shared services; currently a placeholder for future milestones.
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/middleware.php';

// Register API routes.
require_once __DIR__ . '/../routes/api.php';

Flight::start();
