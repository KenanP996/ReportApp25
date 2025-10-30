<?php

declare(strict_types=1);

namespace ReportApp25\Dao;

class CompanyDao extends BaseDao
{
    protected string $table = 'companies';
    protected array $fillable = [
        'name',
        'province',
        'city',
        'contact_name',
        'contact_email',
        'contact_phone',
        'onboarding_date',
    ];
}
