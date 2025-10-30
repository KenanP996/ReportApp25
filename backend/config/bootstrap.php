<?php

declare(strict_types=1);

use Dotenv\Dotenv;
use Flight;
use PDO;
use PDOException;
use ReportApp25\Dao\CompanyDao;
use ReportApp25\Dao\PickupDao;
use ReportApp25\Dao\ReportDao;
use ReportApp25\Dao\TeamDao;
use ReportApp25\Dao\UserDao;

$baseDir = dirname(__DIR__);

if (class_exists(Dotenv::class) && file_exists($baseDir . '/.env')) {
    Dotenv::createImmutable($baseDir)->safeLoad();
}

$config = [
    'appName' => 'ReportApp25',
    'version' => '0.2.0-m2',
    'db' => [
        'driver' => $_ENV['DB_DRIVER'] ?? 'mysql',
        'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
        'port' => (int) ($_ENV['DB_PORT'] ?? 3306),
        'database' => $_ENV['DB_NAME'] ?? 'reportapp25',
        'username' => $_ENV['DB_USER'] ?? 'reportapp_user',
        'password' => $_ENV['DB_PASS'] ?? '',
        'charset' => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
    ],
];

Flight::set('config', $config);

Flight::map('pdo', static function () use ($config): PDO {
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf(
        '%s:host=%s;port=%d;dbname=%s;charset=%s',
        $config['db']['driver'],
        $config['db']['host'],
        $config['db']['port'],
        $config['db']['database'],
        $config['db']['charset']
    );

    try {
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
    } catch (PDOException $exception) {
        Flight::halt(500, json_encode([
            'error' => 'Database connection failed',
            'details' => $exception->getMessage(),
        ]));
    }

    return $pdo;
});

Flight::map('dao.users', static function () {
    static $dao = null;
    if ($dao instanceof UserDao) {
        return $dao;
    }
    $dao = new UserDao(Flight::pdo());

    return $dao;
});

Flight::map('dao.teams', static function () {
    static $dao = null;
    if ($dao instanceof TeamDao) {
        return $dao;
    }
    $dao = new TeamDao(Flight::pdo());

    return $dao;
});

Flight::map('dao.companies', static function () {
    static $dao = null;
    if ($dao instanceof CompanyDao) {
        return $dao;
    }
    $dao = new CompanyDao(Flight::pdo());

    return $dao;
});

Flight::map('dao.reports', static function () {
    static $dao = null;
    if ($dao instanceof ReportDao) {
        return $dao;
    }
    $dao = new ReportDao(Flight::pdo());

    return $dao;
});

Flight::map('dao.pickups', static function () {
    static $dao = null;
    if ($dao instanceof PickupDao) {
        return $dao;
    }
    $dao = new PickupDao(Flight::pdo());

    return $dao;
});
