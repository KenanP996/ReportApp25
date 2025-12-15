<?php

declare(strict_types=1);

namespace ReportApp25\Dao;

class UserDao extends BaseDao
{
    protected string $table = 'users';
    protected array $fillable = [
        'email',
        'password_hash',
        'full_name',
        'role',
        'team_id',
    ];

    protected function transformAfterFetch(array $row): array
    {
        unset($row['password_hash']);

        return $row;
    }

    /**
    * @return array<string, mixed>|null
    */
    public function findByEmailWithPassword(string $email): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row ?: null;
    }
}
