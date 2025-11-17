<?php

declare(strict_types=1);

namespace ReportApp25\Dao;

class TeamApplicationDao extends BaseDao
{
    protected string $table = 'team_applications';
    protected array $fillable = [
        'team_id',
        'applicant_email',
        'applicant_name',
        'status',
        'notes',
        'reviewer_id',
        'reviewed_at',
    ];
}
