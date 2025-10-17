<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Flight;

// Bootstrap shared services; currently a placeholder for future milestones.
require_once __DIR__ . '/../config/bootstrap.php';

// Register API routes.
require_once __DIR__ . '/../routes/api.php';

Flight::start();
