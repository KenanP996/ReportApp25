<?php

declare(strict_types=1);

namespace ReportApp25\Services;

class PickupService extends BaseService
{
    protected function validateForCreate(array $data): array
    {
        $this->requireFields($data, ['report_id', 'scheduled_by', 'pickup_window_start', 'pickup_window_end', 'location']);

        $data['report_id'] = (int) $data['report_id'];
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
