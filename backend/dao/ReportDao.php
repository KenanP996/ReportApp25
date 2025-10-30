<?php

declare(strict_types=1);

namespace ReportApp25\Dao;

class ReportDao extends BaseDao
{
    protected string $table = 'reports';
    protected array $fillable = [
        'company_id',
        'submitted_by',
        'status',
        'total_items',
        'item_breakdown',
        'submitted_at',
    ];

    protected function transformBeforeSave(array $payload): array
    {
        if (array_key_exists('item_breakdown', $payload) && is_array($payload['item_breakdown'])) {
            $payload['item_breakdown'] = json_encode($payload['item_breakdown'], JSON_THROW_ON_ERROR);
        }

        return $payload;
    }

    protected function transformAfterFetch(array $row): array
    {
        if (array_key_exists('item_breakdown', $row) && is_string($row['item_breakdown'])) {
            $decoded = json_decode($row['item_breakdown'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $row['item_breakdown'] = $decoded;
            }
        }

        return $row;
    }
}
