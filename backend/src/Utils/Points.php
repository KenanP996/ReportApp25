<?php

declare(strict_types=1);

namespace ReportApp25\Utils;

/**
 * Lightweight port of the playground points utilities.
 * Uses common item keys to compute points and summary totals.
 */
class Points
{
    private const DEFAULT_WEIGHTS = [
        'numPcs' => 1,
        'numLaptops' => 2,
        'numSurface' => 2,
        'numServers' => 3,
        'numSwitchers' => 2,
        'numHdds' => 1,
        'memberships' => 1,
    ];

    private const ITEM_ALIASES = [
        'numPcs' => ['num_pcs', 'pcs', 'pc'],
        'numLaptops' => ['num_laptops', 'laptops', 'laptop'],
        'numSurface' => ['num_surface', 'num_surfaces', 'surface', 'surfaces'],
        'numServers' => ['num_servers', 'servers', 'server'],
        'numSwitchers' => ['num_switchers', 'switches', 'switchers', 'switcher'],
        'numHdds' => ['num_hdds', 'hdds', 'hdd', 'totalshreddingamount', 'total_shredding_amount', 'shredding'],
        'memberships' => ['num_memberships', 'membership', 'memberships', 'members'],
    ];

    /**
     * @param array<string, int|float> $items
     */
    public static function calculatePoints(array $items): int
    {
        $points = 0;
        foreach (self::DEFAULT_WEIGHTS as $key => $weight) {
            $points += (int) ($items[$key] ?? 0) * $weight;
        }

        return $points;
    }

    /**
     * @param array<string, mixed> $report
     * @return array<string, mixed>
     */
    public static function summarizeReport(array $report): array
    {
        $items = self::normalizeItems($report['item_breakdown'] ?? []);
        $points = self::calculatePoints($items);

        return [
            'id' => $report['id'] ?? null,
            'company_id' => $report['company_id'] ?? null,
            'submitted_by' => $report['submitted_by'] ?? null,
            'status' => $report['status'] ?? null,
            'total_items' => $report['total_items'] ?? 0,
            'points' => $points,
            'items' => $items,
            'submitted_at' => $report['submitted_at'] ?? null,
        ];
    }

    /**
     * @param array<string, mixed> $items
     * @return array<string, int>
     */
    public static function normalizeItems(array $items): array
    {
        $lowercaseItems = [];
        foreach ($items as $key => $value) {
            if (!is_string($key)) {
                continue;
            }
            $lowercaseItems[strtolower($key)] = $value;
        }

        $normalized = [];
        foreach (self::DEFAULT_WEIGHTS as $key => $weight) {
            $value = self::valueForKey($lowercaseItems, $key);
            $normalized[$key] = (int) ($value ?? 0);
        }

        return $normalized;
    }

    /**
     * @param array<string, mixed> $items
     */
    private static function valueForKey(array $items, string $targetKey): mixed
    {
        $candidates = array_merge(
            [strtolower($targetKey)],
            self::ITEM_ALIASES[$targetKey] ?? []
        );

        foreach ($candidates as $candidate) {
            $lookup = strtolower((string) $candidate);
            if (array_key_exists($lookup, $items)) {
                return $items[$lookup];
            }
        }

        return null;
    }
}
