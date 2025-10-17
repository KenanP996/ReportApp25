<?php

declare(strict_types=1);

use Flight;

// Placeholder shared container bindings. Future milestones will add PDO, JWT, etc.
Flight::set('config', [
    'appName' => 'ReportApp25',
    'version' => '0.1.0-m1',
]);
