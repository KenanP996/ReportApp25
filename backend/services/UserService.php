<?php

declare(strict_types=1);

namespace ReportApp25\Services;

use ReportApp25\Dao\UserDao;

class UserService extends BaseService
{
    public function findWithPassword(string $email): ?array
    {
        /** @var UserDao $dao */
        $dao = $this->dao;

        return $dao->findByEmailWithPassword($email);
    }

    protected function validateForCreate(array $data): array
    {
        $this->requireFields($data, ['email', 'password', 'full_name']);
        $this->validateEmail('email', $data['email']);
        $data['role'] = $this->normalizeRole($data['role'] ?? 'team_lead');
        $data['password_hash'] = $this->hashPassword($data['password']);
        unset($data['password']);

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
            $data['role'] = $this->normalizeRole($data['role']);
        }

        if (isset($data['password']) && is_string($data['password']) && $data['password'] !== '') {
            $data['password_hash'] = $this->hashPassword($data['password']);
            unset($data['password']);
        }

        if (isset($data['team_id']) && $data['team_id'] !== null) {
            $data['team_id'] = (int) $data['team_id'];
        }

        return $data;
    }

    private function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    private function normalizeRole(string $role): string
    {
        $this->validateEnum('role', $role, ['manager', 'team_lead']);

        return $role;
    }
}
