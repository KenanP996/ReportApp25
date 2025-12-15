<?php

declare(strict_types=1);

namespace ReportApp25\Services;

class ReportService extends BaseService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function summarize(): array
    {
        $reports = $this->dao->all();
        $summaries = [];
        foreach ($reports as $report) {
            $summaries[] = \ReportApp25\Utils\Points::summarizeReport($report);
        }
        return $summaries;
    }

    /**
     * @return array<string, mixed>
     */
    public function statistics(): array
    {
        $summaries = $this->summarize();
        $totals = [
            'count' => count($summaries),
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

        foreach ($summaries as $summary) {
            $totals['points'] += $summary['points'];
            foreach ($totals['items'] as $key => $val) {
                $totals['items'][$key] += $summary['items'][$key] ?? 0;
            }
            $status = $summary['status'] ?? 'unknown';
            $totals['by_status'][$status] = ($totals['by_status'][$status] ?? 0) + 1;
        }

        return [
            'totals' => $totals,
            'reports' => $summaries,
        ];
    }

    /**
     * @return string CSV content
     */
    public function exportCsv(): string
    {
        $summaries = $this->summarize();
        if (empty($summaries)) {
            return '';
        }

        $headers = ['id', 'company_id', 'submitted_by', 'status', 'total_items', 'points', 'submitted_at'];
        $lines = [implode(',', $headers)];

        foreach ($summaries as $summary) {
            $row = [];
            foreach ($headers as $header) {
                $val = $summary[$header] ?? '';
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
}
