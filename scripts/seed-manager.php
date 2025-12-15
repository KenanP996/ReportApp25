#!/usr/bin/env php
<?php

declare(strict_types=1);

// Usage: php scripts/seed-manager.php email password "Full Name"
// Uses environment variables for DB connection (same as backend/.env)

[$script, $email, $password, $fullName] = array_pad($argv, 4, null);

if (!$email || !$password || !$fullName) {
    fwrite(STDERR, "Usage: php scripts/seed-manager.php email password \"Full Name\"\n");
    exit(1);
}

$env = [
    'DB_DRIVER' => getenv('DB_DRIVER') ?: 'mysql',
    'DB_HOST' => getenv('DB_HOST') ?: '127.0.0.1',
    'DB_PORT' => getenv('DB_PORT') ?: '3306',
    'DB_NAME' => getenv('DB_NAME') ?: 'reportapp25',
    'DB_USER' => getenv('DB_USER') ?: 'reportapp_user',
    'DB_PASS' => getenv('DB_PASS') ?: '',
];

$dsn = sprintf(
    '%s:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    $env['DB_DRIVER'],
    $env['DB_HOST'],
    $env['DB_PORT'],
    $env['DB_NAME']
);

try {
    $pdo = new PDO(
        $dsn,
        $env['DB_USER'],
        $env['DB_PASS'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (Throwable $e) {
    fwrite(STDERR, "DB connection failed: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
$stmt->execute(['email' => $email]);
if ($stmt->fetch()) {
    fwrite(STDOUT, "User already exists: {$email}\n");
    exit(0);
}

$insert = $pdo->prepare('INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at) VALUES (:email, :password_hash, :full_name, :role, NOW(), NOW())');
$insert->execute([
    'email' => $email,
    'password_hash' => $hash,
    'full_name' => $fullName,
    'role' => 'manager',
]);

fwrite(STDOUT, "Seeded manager user: {$email}\n");
