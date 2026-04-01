-- Backfill parent_alerts_table from collection_entries: single-source-table collections first.
WITH
    single_table_incidents AS (
        SELECT
            ce.collection_id,
            MIN(ce.source_table) AS parent_alerts_table
        FROM
            collection_entries ce
        GROUP BY
            ce.collection_id
        HAVING
            COUNT(DISTINCT ce.source_table) = 1
    )
UPDATE incidents i
SET
    parent_alerts_table = s.parent_alerts_table
FROM
    single_table_incidents s
WHERE
    i.collection_id = s.collection_id
    AND i.parent_alerts_table IS NULL;
--> statement-breakpoint
-- Dominant source_table (>= 45% of rows) for remaining incidents.
WITH table_counts AS (
  SELECT
    ce.collection_id,
    ce.source_table,
    COUNT(*) AS cnt,
    SUM(COUNT(*)) OVER (PARTITION BY ce.collection_id) AS total
  FROM collection_entries ce
  GROUP BY ce.collection_id, ce.source_table
),
dominant_table AS (
  SELECT
    collection_id,
    source_table AS parent_alerts_table
  FROM table_counts
  WHERE cnt::float / total >= 0.45
)
UPDATE incidents i
SET parent_alerts_table = d.parent_alerts_table
FROM dominant_table d
WHERE i.collection_id = d.collection_id
  AND i.parent_alerts_table IS NULL;
