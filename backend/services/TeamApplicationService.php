<?php

declare(strict_types=1);

namespace ReportApp25\Services;

class TeamApplicationService extends BaseService
{
    protected function validateForCreate(array $data): array
    {
        $this->requireFields($data, ['team_id', 'applicant_email', 'applicant_name']);
        $data['team_id'] = (int) $data['team_id'];
        $this->validateEmail('applicant_email', $data['applicant_email']);

        $status = $data['status'] ?? 'pending';
        $this->validateEnum('status', $status, ['pending', 'interview', 'approved', 'denied']);
        $data['status'] = $status;

        return $data;
    }

    protected function validateForUpdate(array $data): array
    {
        if (isset($data['team_id'])) {
            $data['team_id'] = (int) $data['team_id'];
        }

        if (isset($data['applicant_email'])) {
            $this->validateEmail('applicant_email', $data['applicant_email']);
        }

        if (isset($data['status'])) {
            $this->validateEnum('status', $data['status'], ['pending', 'interview', 'approved', 'denied']);
        }

        if (isset($data['reviewer_id'])) {
            $data['reviewer_id'] = (int) $data['reviewer_id'];
        }

        return $data;
    }
}
