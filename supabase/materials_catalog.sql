-- ============================================================
-- PIPES & FITTINGS CATALOG — expands the materials table.
-- Re-runnable: removes any previously-added catalog rows (id >= 16, which are
-- NOT referenced by the seeded PR/PO items, ids 1-15) and re-inserts the full set.
-- preferred_supplier_id: 1 Hua Yang, 3 PipeMaster, 4 FlowPro, 7 AquaFlow.
-- ============================================================

delete from materials where id >= 16;

insert into materials (id, name, category, unit, estimated_unit_cost, preferred_supplier_id) values
  -- uPVC pressure / soil & waste pipes (per 4m length)
  (16, 'uPVC Pipe 32mm (4m length)',   'Pipes', 'length',  14.00, 3),
  (17, 'uPVC Pipe 40mm (4m length)',   'Pipes', 'length',  18.50, 3),
  (18, 'uPVC Pipe 50mm (4m length)',   'Pipes', 'length',  22.00, 3),
  (19, 'uPVC Pipe 65mm (4m length)',   'Pipes', 'length',  30.00, 3),
  (20, 'uPVC Pipe 80mm (4m length)',   'Pipes', 'length',  38.00, 3),
  (21, 'uPVC Pipe 100mm (4m length)',  'Pipes', 'length',  46.00, 3),
  (22, 'uPVC Pipe 125mm (4m length)',  'Pipes', 'length',  64.00, 3),
  (23, 'uPVC Pipe 200mm (4m length)',  'Pipes', 'length',  98.00, 3),
  -- PVC pipes (per 4m length)
  (24, 'PVC Pipe 25mm (4m length)',    'Pipes', 'length',   8.00, 1),
  (25, 'PVC Pipe 32mm (4m length)',    'Pipes', 'length',  10.50, 1),
  (26, 'PVC Pipe 40mm (4m length)',    'Pipes', 'length',  11.50, 1),
  -- HDPE pipes (per metre)
  (27, 'HDPE Pipe 20mm',               'Pipes', 'metre',    3.20, 3),
  (28, 'HDPE Pipe 25mm',               'Pipes', 'metre',    4.10, 3),
  (29, 'HDPE Pipe 32mm',               'Pipes', 'metre',    5.40, 3),
  (30, 'HDPE Pipe 40mm',               'Pipes', 'metre',    6.80, 3),
  (31, 'HDPE Pipe 50mm',               'Pipes', 'metre',    8.10, 3),
  (32, 'HDPE Pipe 75mm',               'Pipes', 'metre',   12.50, 3),
  (33, 'HDPE Pipe 90mm',               'Pipes', 'metre',   16.80, 3),
  (34, 'HDPE Pipe 110mm',              'Pipes', 'metre',   23.50, 3),
  (35, 'HDPE Pipe 160mm',              'Pipes', 'metre',   48.00, 3),
  -- PPR hot/cold water pipes (per 4m length)
  (36, 'PPR Pipe 25mm (4m length)',    'Pipes', 'length',  11.00, 1),
  (37, 'PPR Pipe 32mm (4m length)',    'Pipes', 'length',  15.50, 1),
  (38, 'PPR Pipe 40mm (4m length)',    'Pipes', 'length',  22.00, 1),
  (39, 'PPR Pipe 50mm (4m length)',    'Pipes', 'length',  33.00, 1),
  (40, 'PPR Pipe 63mm (4m length)',    'Pipes', 'length',  48.00, 1),
  -- GI (galvanised iron) pipes (per 6m length)
  (41, 'GI Pipe 15mm (6m length)',     'Pipes', 'length',  28.00, 7),
  (42, 'GI Pipe 20mm (6m length)',     'Pipes', 'length',  35.00, 7),
  (43, 'GI Pipe 25mm (6m length)',     'Pipes', 'length',  46.00, 7),
  (44, 'GI Pipe 32mm (6m length)',     'Pipes', 'length',  62.00, 7),
  (45, 'GI Pipe 40mm (6m length)',     'Pipes', 'length',  74.00, 7),
  (46, 'GI Pipe 50mm (6m length)',     'Pipes', 'length',  96.00, 7),
  -- Copper pipes (per metre)
  (47, 'Copper Pipe 15mm',             'Pipes', 'metre',   18.00, 7),
  (48, 'Copper Pipe 22mm',             'Pipes', 'metre',   28.00, 7),
  (49, 'Copper Pipe 28mm',             'Pipes', 'metre',   38.00, 7),
  -- Cast iron / SCI soil pipes (per 3m length)
  (50, 'Cast Iron Soil Pipe 50mm',     'Pipes', 'length',  85.00, 1),
  (51, 'Cast Iron Soil Pipe 75mm',     'Pipes', 'length', 120.00, 1),
  (52, 'Cast Iron Soil Pipe 100mm',    'Pipes', 'length', 165.00, 1),
  (53, 'Cast Iron Soil Pipe 150mm',    'Pipes', 'length', 280.00, 1),

  -- uPVC fittings (pcs)
  (54, 'uPVC Elbow 90deg 50mm',        'Fittings', 'pcs',   2.20, 1),
  (55, 'uPVC Elbow 90deg 75mm',        'Fittings', 'pcs',   3.80, 1),
  (56, 'uPVC Elbow 90deg 100mm',       'Fittings', 'pcs',   5.50, 1),
  (57, 'uPVC Elbow 90deg 160mm',       'Fittings', 'pcs',  12.00, 1),
  (58, 'uPVC Elbow 45deg 110mm',       'Fittings', 'pcs',   6.20, 1),
  (59, 'uPVC Tee Equal 50mm',          'Fittings', 'pcs',   3.00, 1),
  (60, 'uPVC Tee Equal 100mm',         'Fittings', 'pcs',   7.50, 1),
  (61, 'uPVC Reducer 110x50mm',        'Fittings', 'pcs',   4.80, 1),
  (62, 'uPVC Coupling/Socket 110mm',   'Fittings', 'pcs',   4.20, 1),
  (63, 'uPVC Bend 88deg 100mm',        'Fittings', 'pcs',   6.80, 1),
  (64, 'uPVC Y-Junction 100mm',        'Fittings', 'pcs',   9.50, 1),
  (65, 'uPVC End Cap 110mm',           'Fittings', 'pcs',   3.20, 1),
  (66, 'uPVC P-Trap 100mm',            'Fittings', 'pcs',  14.00, 1),
  (67, 'uPVC Access/Cleaning Eye 110mm','Fittings', 'pcs',  8.50, 1),
  (68, 'uPVC Expansion Joint 110mm',   'Fittings', 'pcs',  11.50, 1),
  -- PPR fittings (pcs)
  (69, 'PPR Elbow 25mm',               'Fittings', 'pcs',   1.80, 1),
  (70, 'PPR Tee 25mm',                 'Fittings', 'pcs',   2.40, 1),
  (71, 'PPR Coupling 25mm',            'Fittings', 'pcs',   1.50, 1),
  (72, 'PPR Male Threaded Adaptor 25mm','Fittings', 'pcs',  3.20, 1),
  (73, 'PPR Female Threaded Adaptor 25mm','Fittings','pcs',  3.40, 1),
  -- HDPE fittings (pcs)
  (74, 'HDPE Butt-Fusion Elbow 63mm',  'Fittings', 'pcs',   9.50, 3),
  (75, 'HDPE Electrofusion Coupling 63mm','Fittings','pcs', 14.00, 3),
  (76, 'HDPE Reducer 110x63mm',        'Fittings', 'pcs',  12.00, 3),
  (77, 'HDPE Stub Flange 110mm',       'Fittings', 'pcs',  18.50, 3),
  (78, 'HDPE End Cap 63mm',            'Fittings', 'pcs',   6.00, 3),
  -- GI fittings (pcs)
  (79, 'GI Elbow 25mm',                'Fittings', 'pcs',   4.50, 7),
  (80, 'GI Tee 25mm',                  'Fittings', 'pcs',   6.00, 7),
  (81, 'GI Socket 25mm',               'Fittings', 'pcs',   3.20, 7),
  (82, 'GI Union 25mm',                'Fittings', 'pcs',   8.50, 7),
  (83, 'GI Nipple 25mm',               'Fittings', 'pcs',   2.80, 7),
  (84, 'GI Reducing Socket 32x25mm',   'Fittings', 'pcs',   4.80, 7),
  -- Copper fittings (pcs)
  (85, 'Copper Elbow 15mm (solder)',   'Fittings', 'pcs',   2.40, 7),
  (86, 'Copper Tee 15mm (solder)',     'Fittings', 'pcs',   3.60, 7),
  (87, 'Copper Coupling 15mm',         'Fittings', 'pcs',   1.80, 7),
  -- Brass fittings (pcs)
  (88, 'Brass Adaptor 15mm',           'Fittings', 'pcs',   5.50, 4),
  (89, 'Brass Nipple 15mm',            'Fittings', 'pcs',   4.20, 4);

select setval(pg_get_serial_sequence('materials','id'), (select max(id) from materials));
