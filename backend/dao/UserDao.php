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
}
