<?php

declare(strict_types=1);

namespace ReportApp25\Services;

class ReportService extends BaseService
{
    protected function validateForCreate(array $data): array
    {
        $this->requireFields($data, ['company_id', 'submitted_by', 'item_breakdown']);

        $data['company_id'] = (int) $data['company_id'];
        $data['submitted_by'] = (int) $data['submitted_by'];

        $status = $data['status'] ?? 'draft';
        $this->validateEnum('status', $status, ['draft', 'submitted', 'approved', 'rejected']);
        $data['status'] = $status;

        $data['total_items'] = isset($data['total_items']) ? (int) $data['total_items'] : 0;

        if (!is_array($data['item_breakdown'])) {
            throw new \InvalidArgumentException('Field "item_breakdown" must be an object/associative array');
        }

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

        if (isset($data['total_items'])) {
            $data['total_items'] = (int) $data['total_items'];
        }

        return $data;
    }
}
