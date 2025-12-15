<?php

declare(strict_types=1);

namespace ReportApp25\Services;

use ReportApp25\Utils\Points;

class PickupService extends BaseService
{
    /**
     * Create a pickup and, if no report_id is provided, auto-create a linked report using payload items.
     *
     * @param array<string, mixed> $data
     */
    public function createWithReport(array $data, ReportService $reportService): array
    {
        $reportId = $data['report_id'] ?? null;
        $companyId = $data['company_id'] ?? null;
        $scheduledBy = $data['scheduled_by'] ?? null;
        $payload = is_array($data['payload'] ?? null) ? $data['payload'] : [];

        if (empty($reportId)) {
            if ($companyId === null || $scheduledBy === null) {
                throw new \InvalidArgumentException('company_id and scheduled_by are required when creating a pickup without an existing report');
            }

            $items = [];
            if (isset($payload['item_breakdown']) && is_array($payload['item_breakdown'])) {
                $items = Points::normalizeItems($payload['item_breakdown']);
            }
            $totalItems = array_sum($items);

            $reportPayload = [
                'company_id' => (int) $companyId,
                'submitted_by' => (int) $scheduledBy,
                'status' => 'submitted',
                'total_items' => $totalItems,
                'item_breakdown' => $items,
            ];

            $report = $reportService->create($reportPayload);
            $reportId = $report['id'];
        }

        // Remove helper-only keys so we only persist pickup columns.
        unset($data['company_id'], $data['payload']);
        $data['report_id'] = (int) $reportId;

        return $this->create($data);
    }

    protected function validateForCreate(array $data): array
    {
        $this->requireFields($data, ['scheduled_by', 'pickup_window_start', 'pickup_window_end', 'location']);

        if (isset($data['report_id'])) {
            $data['report_id'] = (int) $data['report_id'];
        }

        if (isset($data['company_id'])) {
            $data['company_id'] = (int) $data['company_id'];
        }

        if (isset($data['payload']) && !is_array($data['payload'])) {
            throw new \InvalidArgumentException('Field "payload" must be an object/associative array');
        }

        $data['scheduled_by'] = (int) $data['scheduled_by'];
        $this->validateDate('pickup_window_start', $data['pickup_window_start']);
        $this->validateDate('pickup_window_end', $data['pickup_window_end']);

        $status = $data['status'] ?? 'pending';
        $this->validateEnum('status', $status, ['pending', 'scheduled', 'completed', 'cancelled']);
        $data['status'] = $status;

        return $data;
    }

    protected function validateForUpdate(array $data): array
    {
        if (isset($data['report_id'])) {
            $data['report_id'] = (int) $data['report_id'];
        }

        if (isset($data['scheduled_by'])) {
            $data['scheduled_by'] = (int) $data['scheduled_by'];
        }

        if (isset($data['company_id'])) {
            $data['company_id'] = (int) $data['company_id'];
        }

        if (isset($data['pickup_window_start'])) {
            $this->validateDate('pickup_window_start', $data['pickup_window_start']);
        }

        if (isset($data['pickup_window_end'])) {
            $this->validateDate('pickup_window_end', $data['pickup_window_end']);
        }

        if (isset($data['status'])) {
            $this->validateEnum('status', $data['status'], ['pending', 'scheduled', 'completed', 'cancelled']);
        }

        return $data;
    }
}
