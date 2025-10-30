<?php

declare(strict_types=1);

namespace ReportApp25\Dao;

class PickupDao extends BaseDao
{
    protected string $table = 'pickups';
    protected array $fillable = [
        'report_id',
        'scheduled_by',
        'pickup_window_start',
        'pickup_window_end',
        'location',
        'status',
    ];
}
