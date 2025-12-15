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

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchWithCompanyDetails(array $filters = []): array
    {
        $sql = '
            SELECT
                r.*,
                c.name AS company_name,
                c.province AS company_province,
                c.city AS company_city,
                c.contact_name AS company_contact_name,
                c.contact_email AS company_contact_email,
                c.contact_phone AS company_contact_phone,
                c.onboarding_date AS company_onboarding_date,
                u.full_name AS submitter_name,
                u.email AS submitter_email
            FROM reports r
            LEFT JOIN companies c ON c.id = r.company_id
            LEFT JOIN users u ON u.id = r.submitted_by
            WHERE 1 = 1
        ';

        $conditions = [];
        $params = [];

        if (isset($filters['month'])) {
            $conditions[] = 'MONTH(r.submitted_at) = :month';
            $params['month'] = (int) $filters['month'];
        }

        if (isset($filters['year'])) {
            $conditions[] = 'YEAR(r.submitted_at) = :year';
            $params['year'] = (int) $filters['year'];
        }

        if (isset($filters['province'])) {
            $conditions[] = 'UPPER(c.province) = :province';
            $params['province'] = strtoupper($filters['province']);
        }

        if (isset($filters['company_id'])) {
            $conditions[] = 'r.company_id = :company_id';
            $params['company_id'] = (int) $filters['company_id'];
        }

        if (isset($filters['submitted_by'])) {
            $conditions[] = 'r.submitted_by = :submitted_by';
            $params['submitted_by'] = (int) $filters['submitted_by'];
        }

        if (isset($filters['status'])) {
            $conditions[] = 'r.status = :status';
            $params['status'] = $filters['status'];
        }

        if ($conditions !== []) {
            $sql .= ' AND ' . implode(' AND ', $conditions);
        }

        $sql .= ' ORDER BY r.submitted_at DESC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        return array_map(function (array $row): array {
            if (array_key_exists('item_breakdown', $row) && is_string($row['item_breakdown'])) {
                $decoded = json_decode($row['item_breakdown'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $row['item_breakdown'] = $decoded;
                }
            }

            return $row;
        }, $rows);
    }
}
