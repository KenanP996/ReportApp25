<?php

declare(strict_types=1);

namespace ReportApp25\Services;

class UserService extends BaseService
{
    protected function validateForCreate(array $data): array
    {
        $this->requireFields($data, ['email', 'password_hash', 'full_name']);
        $this->validateEmail('email', $data['email']);

        $role = $data['role'] ?? 'team_lead';
        $this->validateEnum('role', $role, ['manager', 'team_lead']);
        $data['role'] = $role;

        if (isset($data['team_id']) && $data['team_id'] !== null) {
            $data['team_id'] = (int) $data['team_id'];
        }

        return $data;
    }

    protected function validateForUpdate(array $data): array
    {
        if (isset($data['email'])) {
            $this->validateEmail('email', $data['email']);
        }

        if (isset($data['role'])) {
            $this->validateEnum('role', $data['role'], ['manager', 'team_lead']);
        }

        if (isset($data['team_id']) && $data['team_id'] !== null) {
            $data['team_id'] = (int) $data['team_id'];
        }

        return $data;
    }
}
