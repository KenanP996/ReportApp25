<?php

declare(strict_types=1);

namespace ReportApp25\Services;

class TeamService extends BaseService
{
    protected function validateForCreate(array $data): array
    {
        $this->requireFields($data, ['name', 'region', 'manager_id']);
        $data['manager_id'] = (int) $data['manager_id'];

        return $data;
    }

    protected function validateForUpdate(array $data): array
    {
        if (isset($data['manager_id'])) {
            $data['manager_id'] = (int) $data['manager_id'];
        }

        return $data;
    }
}
