<?php

declare(strict_types=1);

namespace ReportApp25\Dao;

use InvalidArgumentException;
use PDO;
use PDOException;

abstract class BaseDao
{
    protected PDO $pdo;
    protected string $table;
    protected array $fillable = [];

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        $stmt = $this->pdo->query(sprintf('SELECT * FROM %s', $this->table));
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return array_map(fn (array $row) => $this->transformAfterFetch($row), $rows);
    }

    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare(sprintf('SELECT * FROM %s WHERE id = :id', $this->table));
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? $this->transformAfterFetch($row) : null;
    }

    public function create(array $data): array
    {
        $payload = $this->transformBeforeSave($this->filterFillable($data));

        if (empty($payload)) {
            throw new InvalidArgumentException('No valid fields provided for create operation');
        }

        $columns = array_keys($payload);
        $placeholders = array_map(static fn (string $column) => ':' . $column, $columns);

        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $this->table,
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($payload);

        $id = (int) $this->pdo->lastInsertId();
        $created = $this->find($id);

        if (!$created) {
            throw new PDOException(sprintf('Failed to fetch created row from %s', $this->table));
        }

        return $created;
    }

    public function update(int $id, array $data): ?array
    {
        $payload = $this->transformBeforeSave($this->filterFillable($data));

        if (empty($payload)) {
            throw new InvalidArgumentException('No valid fields provided for update operation');
        }

        $setClauses = [];
        foreach (array_keys($payload) as $column) {
            $setClauses[] = sprintf('%s = :%s', $column, $column);
        }

        $payload['id'] = $id;

        $sql = sprintf(
            'UPDATE %s SET %s WHERE id = :id',
            $this->table,
            implode(', ', $setClauses)
        );

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($payload);

        return $this->find($id);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare(sprintf('DELETE FROM %s WHERE id = :id', $this->table));

        return $stmt->execute(['id' => $id]);
    }

    protected function filterFillable(array $data): array
    {
        if (empty($this->fillable)) {
            return $data;
        }

        return array_intersect_key($data, array_flip($this->fillable));
    }

    protected function transformBeforeSave(array $payload): array
    {
        return $payload;
    }

    protected function transformAfterFetch(array $row): array
    {
        return $row;
    }
}
