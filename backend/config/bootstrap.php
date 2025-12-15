<?php

declare(strict_types=1);

use Dotenv\Dotenv;
use ReportApp25\Dao\CompanyDao;
use ReportApp25\Dao\PickupDao;
use ReportApp25\Dao\ReportDao;
use ReportApp25\Dao\TeamApplicationDao;
use ReportApp25\Dao\TeamDao;
use ReportApp25\Dao\UserDao;
use ReportApp25\Services\CompanyService;
use ReportApp25\Services\PickupService;
use ReportApp25\Services\ReportService;
use ReportApp25\Services\TeamApplicationService;
use ReportApp25\Services\TeamService;
use ReportApp25\Services\UserService;

$baseDir = dirname(__DIR__);

if (class_exists(Dotenv::class) && file_exists($baseDir . '/.env')) {
    Dotenv::createImmutable($baseDir)->safeLoad();
}

$config = [
    'appName' => 'ReportApp25',
    'version' => '0.5.0-m5',
    'db' => [
        'driver' => $_ENV['DB_DRIVER'] ?? 'mysql',
        'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
        'port' => (int) ($_ENV['DB_PORT'] ?? 3306),
        'database' => $_ENV['DB_NAME'] ?? 'reportapp25',
        'username' => $_ENV['DB_USER'] ?? 'reportapp_user',
        'password' => $_ENV['DB_PASS'] ?? '',
        'charset' => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
    ],
    'jwt' => [
        'secret' => $_ENV['JWT_SECRET'] ?? 'change-this-secret',
        'issuer' => $_ENV['JWT_ISSUER'] ?? 'reportapp25',
        'ttl' => (int) ($_ENV['JWT_TTL'] ?? 3600),
    ],
];

Flight::set('config', $config);
Flight::set('flight.views.path', __DIR__ . '/../views');

try {
    $dsn = sprintf(
        '%s:host=%s;port=%d;dbname=%s;charset=%s',
        $config['db']['driver'],
        $config['db']['host'],
        $config['db']['port'],
        $config['db']['database'],
        $config['db']['charset']
    );
    $pdo = new PDO(
        $dsn,
        $config['db']['username'],
        $config['db']['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    Flight::set('pdo', $pdo);
} catch (PDOException $exception) {
    Flight::halt(500, json_encode([
        'error' => 'Database connection failed',
        'details' => $exception->getMessage(),
    ]));
}

// Register DAOs
Flight::set('dao.users', new UserDao(Flight::get('pdo')));
Flight::set('dao.teams', new TeamDao(Flight::get('pdo')));
Flight::set('dao.companies', new CompanyDao(Flight::get('pdo')));
Flight::set('dao.reports', new ReportDao(Flight::get('pdo')));
Flight::set('dao.pickups', new PickupDao(Flight::get('pdo')));
Flight::set('dao.team_applications', new TeamApplicationDao(Flight::get('pdo')));

// Register Services
Flight::set('service.users', new UserService(Flight::get('dao.users')));
Flight::set('service.teams', new TeamService(Flight::get('dao.teams')));
Flight::set('service.companies', new CompanyService(Flight::get('dao.companies')));
Flight::set('service.reports', new ReportService(Flight::get('dao.reports')));
Flight::set('service.pickups', new PickupService(Flight::get('dao.pickups')));
Flight::set('service.team_applications', new TeamApplicationService(Flight::get('dao.team_applications')));
