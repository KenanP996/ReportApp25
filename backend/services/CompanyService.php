<?php

declare(strict_types=1);

namespace ReportApp25\Services;

class CompanyService extends BaseService
{
    protected function validateForCreate(array $data): array
    {
        $this->requireFields($data, ['name', 'province', 'city', 'contact_name', 'contact_email', 'onboarding_date']);
        $this->validateEmail('contact_email', $data['contact_email']);

        if (!preg_match('/^[A-Z]{2}$/', strtoupper((string) $data['province']))) {
            throw new \InvalidArgumentException('Field "province" must be a 2-letter code');
        }

        $this->validateDate('onboarding_date', $data['onboarding_date']);

        return $data;
    }

    protected function validateForUpdate(array $data): array
    {
        if (isset($data['contact_email'])) {
            $this->validateEmail('contact_email', $data['contact_email']);
        }

        if (isset($data['province'])) {
            if (!preg_match('/^[A-Z]{2}$/', strtoupper((string) $data['province']))) {
                throw new \InvalidArgumentException('Field "province" must be a 2-letter code');
            }
        }

        if (isset($data['onboarding_date'])) {
            $this->validateDate('onboarding_date', $data['onboarding_date']);
        }

        return $data;
    }
}
