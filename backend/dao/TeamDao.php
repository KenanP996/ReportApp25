<?php

declare(strict_types=1);

namespace ReportApp25\Dao;

class TeamDao extends BaseDao
{
    protected string $table = 'teams';
    protected array $fillable = [
        'name',
        'region',
        'manager_id',
    ];
}
