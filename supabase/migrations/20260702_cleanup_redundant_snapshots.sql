-- ============================================================
-- DOKAN — Cleanup Redundant Snapshot Columns
-- ============================================================
-- unit_price_snapshot was redundant with order_items.unit_price
-- (which already captures the price at order time).
-- The product name snapshots are kept for their intended purpose.
-- ============================================================

alter table order_items drop column if exists unit_price_snapshot;
