<?php

declare(strict_types=1);

namespace ReportApp25\Services;

use ReportApp25\Utils\Points;

class ReportService extends BaseService
{
    /**
     * @return array<string, mixed>
     */
    public function statistics(array $filters = []): array
    {
        $normalizedFilters = $this->normalizeFilters($filters);
        $rows = $this->dao->fetchWithCompanyDetails($normalizedFilters);
        $reports = array_map(fn (array $row) => $this->formatReport($row), $rows);

        return [
            'filters' => $normalizedFilters,
            'totals' => $this->buildTotals($reports),
            'summary_by_province' => $this->buildProvinceSummary($reports),
            'summary_by_city' => $this->buildCitySummary($reports),
            'summary_by_month' => $this->buildMonthlySummary($reports),
            'summary_by_user' => $this->buildUserSummary($reports),
            'company_details' => $this->buildCompanyDetails($reports),
            'reports' => $reports,
        ];
    }

    /**
     * @return string CSV content
     */
    public function exportCsv(): string
    {
        $stats = $this->statistics();
        $reports = $stats['reports'];

        if (empty($reports)) {
            return '';
        }

        $headers = [
            'id',
            'company_id',
            'company_name',
            'company_province',
            'company_city',
            'status',
            'total_items',
            'points',
            'num_pcs',
            'num_laptops',
            'num_surface',
            'num_servers',
            'num_switchers',
            'num_hdds',
            'memberships',
            'submitted_by',
            'submitted_by_name',
            'submitted_by_email',
            'submitted_at',
        ];
        $lines = [implode(',', $headers)];

        foreach ($reports as $report) {
            $row = [];
            foreach ($headers as $header) {
                $val = $report[$header] ?? '';
                $safe = str_replace('"', '""', (string) $val);
                $row[] = '"' . $safe . '"';
            }
            $lines[] = implode(',', $row);
        }

        return implode("\n", $lines);
    }

    protected function validateForCreate(array $data): array
    {
        $data['company_id'] = (int) $data['company_id'];
        $data['submitted_by'] = (int) $data['submitted_by'];

        $status = $data['status'] ?? 'draft';
        $this->validateEnum('status', $status, ['draft', 'submitted', 'approved', 'rejected']);
        $data['status'] = $status;

        if (!is_array($data['item_breakdown'])) {
            throw new \InvalidArgumentException('Field "item_breakdown" must be an object/associative array');
        }

        $items = \ReportApp25\Utils\Points::normalizeItems($data['item_breakdown']);
        $data['item_breakdown'] = $items;
        $data['total_items'] = isset($data['total_items']) ? (int) $data['total_items'] : array_sum($items);

        return $data;
    }

    protected function validateForUpdate(array $data): array
    {
        if (isset($data['company_id'])) {
            $data['company_id'] = (int) $data['company_id'];
        }

        if (isset($data['submitted_by'])) {
            $data['submitted_by'] = (int) $data['submitted_by'];
        }

        if (isset($data['status'])) {
            $this->validateEnum('status', $data['status'], ['draft', 'submitted', 'approved', 'rejected']);
        }

        if (isset($data['item_breakdown']) && !is_array($data['item_breakdown'])) {
            throw new \InvalidArgumentException('Field "item_breakdown" must be an object/associative array');
        }

        if (isset($data['item_breakdown']) && is_array($data['item_breakdown'])) {
            $items = \ReportApp25\Utils\Points::normalizeItems($data['item_breakdown']);
            $data['item_breakdown'] = $items;
            if (!isset($data['total_items'])) {
                $data['total_items'] = array_sum($items);
            }
        }

        if (isset($data['total_items'])) {
            $data['total_items'] = (int) $data['total_items'];
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatReport(array $row): array
    {
        $items = Points::normalizeItems($row['item_breakdown'] ?? []);
        $points = Points::calculatePoints($items);

        return [
            'id' => (int) $row['id'],
            'company_id' => $row['company_id'] !== null ? (int) $row['company_id'] : null,
            'company_name' => $row['company_name'] ?? null,
            'company_province' => $row['company_province'] ?? null,
            'company_city' => $row['company_city'] ?? null,
            'company_contact_name' => $row['company_contact_name'] ?? null,
            'company_contact_email' => $row['company_contact_email'] ?? null,
            'company_contact_phone' => $row['company_contact_phone'] ?? null,
            'company_onboarding_date' => $row['company_onboarding_date'] ?? null,
            'submitted_by' => $row['submitted_by'] !== null ? (int) $row['submitted_by'] : null,
            'submitted_by_name' => $row['submitter_name'] ?? null,
            'submitted_by_email' => $row['submitter_email'] ?? null,
            'status' => $row['status'] ?? null,
            'total_items' => isset($row['total_items']) ? (int) $row['total_items'] : array_sum($items),
            'points' => $points,
            'items' => $items,
            'submitted_at' => $row['submitted_at'] ?? null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildTotals(array $reports): array
    {
        $totals = [
            'count' => count($reports),
            'points' => 0,
            'items' => [
                'numPcs' => 0,
                'numLaptops' => 0,
                'numSurface' => 0,
                'numServers' => 0,
                'numSwitchers' => 0,
                'numHdds' => 0,
                'memberships' => 0,
            ],
            'by_status' => [],
        ];

        $companies = [];

        foreach ($reports as $report) {
            $totals['points'] += $report['points'];
            foreach ($totals['items'] as $key => $value) {
                $totals['items'][$key] += $report['items'][$key] ?? 0;
            }
            $status = $report['status'] ?? 'unknown';
            $totals['by_status'][$status] = ($totals['by_status'][$status] ?? 0) + 1;
            if ($report['company_id']) {
                $companies[$report['company_id']] = true;
            }
        }

        $totals['companies'] = count($companies);

        return $totals;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildProvinceSummary(array $reports): array
    {
        $summary = [];

        foreach ($reports as $report) {
            $province = strtoupper((string) ($report['company_province'] ?? 'Unknown'));
            if (!isset($summary[$province])) {
                $summary[$province] = [
                    'province' => $province,
                    'companies' => [],
                    'total_items' => 0,
                    'points' => 0,
                    'items' => [
                        'numPcs' => 0,
                        'numLaptops' => 0,
                        'numSurface' => 0,
                        'numServers' => 0,
                        'numSwitchers' => 0,
                        'numHdds' => 0,
                        'memberships' => 0,
                    ],
                ];
            }

            if ($report['company_id']) {
                $summary[$province]['companies'][$report['company_id']] = true;
            }
            $summary[$province]['total_items'] += $report['total_items'] ?? 0;
            $summary[$province]['points'] += $report['points'];
            foreach ($summary[$province]['items'] as $key => $value) {
                $summary[$province]['items'][$key] += $report['items'][$key] ?? 0;
            }
        }

        return array_map(static function (array $entry): array {
            $entry['companies'] = count($entry['companies']);

            return $entry;
        }, array_values($summary));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildCitySummary(array $reports): array
    {
        $summary = [];

        foreach ($reports as $report) {
            $province = strtoupper((string) ($report['company_province'] ?? 'Unknown'));
            $cityKey = strtolower(($report['company_city'] ?? 'Unknown') . '|' . $province);

            if (!isset($summary[$cityKey])) {
                $summary[$cityKey] = [
                    'city' => $report['company_city'] ?? 'Unknown',
                    'province' => $province,
                    'companies' => [],
                    'total_items' => 0,
                    'points' => 0,
                    'items' => [
                        'numPcs' => 0,
                        'numLaptops' => 0,
                        'numSurface' => 0,
                        'numServers' => 0,
                        'numSwitchers' => 0,
                        'numHdds' => 0,
                        'memberships' => 0,
                    ],
                ];
            }

            if ($report['company_id']) {
                $summary[$cityKey]['companies'][$report['company_id']] = true;
            }
            $summary[$cityKey]['total_items'] += $report['total_items'] ?? 0;
            $summary[$cityKey]['points'] += $report['points'];
            foreach ($summary[$cityKey]['items'] as $key => $value) {
                $summary[$cityKey]['items'][$key] += $report['items'][$key] ?? 0;
            }
        }

        return array_map(static function (array $entry): array {
            $entry['companies'] = count($entry['companies']);

            return $entry;
        }, array_values($summary));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildCompanyDetails(array $reports): array
    {
        $details = [];

        foreach ($reports as $report) {
            $companyId = $report['company_id'];
            if ($companyId === null) {
                continue;
            }

            if (!isset($details[$companyId])) {
                $details[$companyId] = [
                    'company_id' => $companyId,
                    'company_name' => $report['company_name'] ?? 'Unknown Company',
                    'province' => $report['company_province'] ?? null,
                    'city' => $report['company_city'] ?? null,
                    'contact_name' => $report['company_contact_name'] ?? null,
                    'contact_email' => $report['company_contact_email'] ?? null,
                    'contact_phone' => $report['company_contact_phone'] ?? null,
                    'onboarding_date' => $report['company_onboarding_date'] ?? null,
                    'points' => 0,
                    'total_items' => 0,
                    'items' => [
                        'numPcs' => 0,
                        'numLaptops' => 0,
                        'numSurface' => 0,
                        'numServers' => 0,
                        'numSwitchers' => 0,
                        'numHdds' => 0,
                        'memberships' => 0,
                    ],
                    'reports' => 0,
                    'last_reported_at' => null,
                    'owners' => [],
                ];
            }

            $details[$companyId]['points'] += $report['points'];
            $details[$companyId]['total_items'] += $report['total_items'] ?? 0;
            foreach ($details[$companyId]['items'] as $key => $value) {
                $details[$companyId]['items'][$key] += $report['items'][$key] ?? 0;
            }

            $details[$companyId]['reports'] += 1;
            $submittedAt = $report['submitted_at'] ?? null;
            if ($submittedAt !== null && ($details[$companyId]['last_reported_at'] === null || $submittedAt > $details[$companyId]['last_reported_at'])) {
                $details[$companyId]['last_reported_at'] = $submittedAt;
            }

            if ($report['submitted_by']) {
                $ownerLabel = $report['submitted_by_name'] ?: sprintf('User #%d', $report['submitted_by']);
                $details[$companyId]['owners'][$report['submitted_by']] = $ownerLabel;
            }
        }

        return array_map(static function (array $entry): array {
            $entry['owners'] = array_values($entry['owners']);

            return $entry;
        }, array_values($details));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildMonthlySummary(array $reports): array
    {
        $monthly = [];

        foreach ($reports as $report) {
            $submittedAt = $report['submitted_at'] ?? null;
            $monthKey = $submittedAt ? substr($submittedAt, 0, 7) : 'Unknown';

            if (!isset($monthly[$monthKey])) {
                $monthly[$monthKey] = [
                    'month' => $monthKey,
                    'points' => 0,
                    'total_items' => 0,
                    'reports' => 0,
                ];
            }

            $monthly[$monthKey]['points'] += $report['points'];
            $monthly[$monthKey]['total_items'] += $report['total_items'] ?? 0;
            $monthly[$monthKey]['reports'] += 1;
        }

        ksort($monthly);

        return array_values($monthly);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildUserSummary(array $reports): array
    {
        $users = [];

        foreach ($reports as $report) {
            if ($report['submitted_by'] === null) {
                continue;
            }

            $userId = (int) $report['submitted_by'];
            if (!isset($users[$userId])) {
                $users[$userId] = [
                    'user_id' => $userId,
                    'name' => $report['submitted_by_name'] ?? sprintf('User #%d', $userId),
                    'email' => $report['submitted_by_email'] ?? null,
                    'reports' => 0,
                    'points' => 0,
                    'companies' => [],
                ];
            }

            $users[$userId]['reports'] += 1;
            $users[$userId]['points'] += $report['points'];
            if ($report['company_id']) {
                $users[$userId]['companies'][$report['company_id']] = true;
            }
        }

        return array_map(static function (array $entry): array {
            $entry['companies'] = count($entry['companies']);

            return $entry;
        }, array_values($users));
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeFilters(array $filters): array
    {
        $normalized = [];

        if (isset($filters['month']) && is_numeric($filters['month'])) {
            $month = (int) $filters['month'];
            if ($month >= 1 && $month <= 12) {
                $normalized['month'] = $month;
            }
        }

        if (isset($filters['year']) && is_numeric($filters['year'])) {
            $year = (int) $filters['year'];
            if ($year >= 2000 && $year <= 2100) {
                $normalized['year'] = $year;
            }
        }

        if (!empty($filters['province']) && is_string($filters['province'])) {
            $normalized['province'] = strtoupper($filters['province']);
        }

        if (isset($filters['company_id']) && is_numeric($filters['company_id'])) {
            $normalized['company_id'] = (int) $filters['company_id'];
        }

        if (isset($filters['submitted_by']) && is_numeric($filters['submitted_by'])) {
            $normalized['submitted_by'] = (int) $filters['submitted_by'];
        }

        if (!empty($filters['status']) && is_string($filters['status'])) {
            $normalized['status'] = $filters['status'];
        }

        return $normalized;
    }
}
