<?php

declare(strict_types=1);

namespace ReportApp25\Services;

use InvalidArgumentException;
use ReportApp25\Dao\BaseDao;

abstract class BaseService
{
    protected BaseDao $dao;

    public function __construct(BaseDao $dao)
    {
        $this->dao = $dao;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        return $this->dao->all();
    }

    public function find(int $id): ?array
    {
        return $this->dao->find($id);
    }

    public function create(array $data): array
    {
        $validated = $this->validateForCreate($data);

        return $this->dao->create($validated);
    }

    public function update(int $id, array $data): ?array
    {
        $validated = $this->validateForUpdate($data);

        return $this->dao->update($id, $validated);
    }

    public function delete(int $id): bool
    {
        return $this->dao->delete($id);
    }

    abstract protected function validateForCreate(array $data): array;

    abstract protected function validateForUpdate(array $data): array;

    protected function requireFields(array $data, array $fields): void
    {
        foreach ($fields as $field) {
            if (!array_key_exists($field, $data) || $data[$field] === '' || $data[$field] === null) {
                throw new InvalidArgumentException(sprintf('Field "%s" is required', $field));
            }
        }
    }

    protected function validateEnum(string $field, mixed $value, array $allowed): void
    {
        if (!in_array($value, $allowed, true)) {
            throw new InvalidArgumentException(sprintf('Field "%s" must be one of: %s', $field, implode(', ', $allowed)));
        }
    }

    protected function validateEmail(string $field, mixed $value): void
    {
        if (!is_string($value) || filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
            throw new InvalidArgumentException(sprintf('Field "%s" must be a valid email address', $field));
        }
    }

    protected function validateDate(string $field, mixed $value): void
    {
        if (!is_string($value) || strtotime($value) === false) {
            throw new InvalidArgumentException(sprintf('Field "%s" must be a valid date/time string', $field));
        }
    }
}
