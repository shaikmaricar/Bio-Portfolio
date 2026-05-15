import { useState } from "react";

// ── Colour tokens ──────────────────────────────────────────────────────────
const C = {
  bg: "#07090f",
  panel: "#0d1117",
  border: "#1c2333",
  borderHi: "#2a3a55",
  cyan: "#38bdf8",
  cyanDim: "#0e3a52",
  green: "#4ade80",
  greenDim: "#0e2e1a",
  amber: "#fbbf24",
  amberDim: "#2e1f05",
  purple: "#a78bfa",
  purpleDim: "#1e1535",
  red: "#f87171",
  redDim: "#2e1010",
  text: "#e2e8f0",
  muted: "#64748b",
  faint: "#1e2535",
};

// ── Shared styles ──────────────────────────────────────────────────────────
const mono = '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace';
const sans = '"DM Sans", "Plus Jakarta Sans", system-ui, sans-serif';

const styles = {
  root: {
    background: C.bg,
    minHeight: "100vh",
    fontFamily: sans,
    color: C.text,
    fontSize: 14,
  },
  header: {
    background: `linear-gradient(135deg, #0a1628 0%, #07090f 60%)`,
    borderBottom: `1px solid ${C.border}`,
    padding: "28px 40px 24px",
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(12px)",
  },
  badge: (color) => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    background: color + "22",
    color: color,
    border: `1px solid ${color}44`,
  }),
  tab: (active) => ({
    padding: "9px 18px",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: sans,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? C.cyan : C.muted,
    background: active ? C.cyanDim : "transparent",
    border: `1px solid ${active ? C.cyan + "55" : "transparent"}`,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  }),
  card: {
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: 24,
    marginBottom: 20,
  },
  codeBlock: {
    background: "#050709",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "16px 20px",
    fontFamily: mono,
    fontSize: 12.5,
    lineHeight: 1.7,
    overflowX: "auto",
    whiteSpace: "pre",
    color: "#c9d1d9",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: C.text,
    marginBottom: 6,
    letterSpacing: "-0.02em",
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: C.muted,
    marginBottom: 8,
  },
  pill: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background: color + "18",
    color: color,
    border: `1px solid ${color}33`,
    margin: "3px 4px 3px 0",
  }),
  stepCircle: (color) => ({
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: color + "22",
    border: `2px solid ${color}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: color,
    fontWeight: 800,
    fontSize: 13,
    flexShrink: 0,
  }),
};

// ── Syntax highlighting — left-to-right consuming tokenizer ───────────────
// Each pattern is tried against the START of the remaining string.
// Once a match is consumed, no regex ever re-processes already-coloured text.
const CYPHER_RULES = [
  { re: /^(\/\/.*)$/,                                                                                                                color: "#6a737d" },
  { re: /^(apoc\.[a-zA-Z][a-zA-Z0-9.]*)/,                                                                                          color: "#79c0ff" },
  { re: /^(db\.[a-zA-Z][a-zA-Z0-9.]*)/,                                                                                             color: "#79c0ff" },
  { re: /^(CALL|YIELD|RETURN|WITH|WHERE|MATCH|CREATE|MERGE|SET|DETACH DELETE|UNWIND|FOREACH|OPTIONAL MATCH|ORDER BY|LIMIT|SKIP|DISTINCT|AS|IN|IS|NOT|AND|OR|CASE|WHEN|THEN|ELSE|END|ON CREATE SET|ON MATCH SET)(?=[^a-zA-Z_]|$)/, color: "#ff7b72" },
  { re: /^(true|false|null)(?=[^a-zA-Z_]|$)/,                                                                                       color: "#ffa657" },
  { re: /^('[^']*')/,                                                                                                                color: "#a5d6ff" },
  { re: /^("(?:[^"\\]|\\.)*")/,                                                                                                     color: "#a5d6ff" },
  { re: /^(`[^`]*`)/,                                                                                                                color: "#a5d6ff" },
  { re: /^(\d+\.?\d*)/,                                                                                                              color: "#f2cc60" },
  { re: /^([{}[\]])/,                                                                                                                color: "#e3b341" },
];

const PYTHON_RULES = [
  { re: /^(#.*)/,                                                                                                                    color: "#6a737d" },
  { re: /^(f"""[\s\S]*?"""|f'''[\s\S]*?'''|"""[\s\S]*?"""|'''[\s\S]*?''')/,                                                       color: "#a5d6ff" },
  { re: /^(f"(?:[^"\\]|\\.)*"|f'(?:[^'\\]|\\.)*')/,                                                                               color: "#a5d6ff" },
  { re: /^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/,                                                                                 color: "#a5d6ff" },
  { re: /^(import|from|def|class|return|for|in|if|else|elif|with|as|try|except|async|await|not|and|or|True|False|None|lambda|yield|pass|break|continue|raise|global|nonlocal)(?=[^a-zA-Z0-9_]|$)/, color: "#ff7b72" },
  { re: /^([a-z_][a-zA-Z_0-9]*)(?=\s*\()/,                                                                                        color: "#d2a8ff" },
  { re: /^([A-Z][a-zA-Z_0-9]*)(?=[^a-zA-Z0-9_(]|$)/,                                                                             color: "#ffa657" },
  { re: /^(\d+\.?\d*)/,                                                                                                             color: "#f2cc60" },
];

function tokenizeLine(line, lang) {
  const rules = lang === "python" ? PYTHON_RULES : CYPHER_RULES;
  const tokens = [];
  let rem = line;
  while (rem.length > 0) {
    let matched = false;
    for (const { re, color } of rules) {
      const m = rem.match(re);
      if (m) {
        tokens.push({ v: m[1] !== undefined ? m[1] : m[0], c: color });
        rem = rem.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Merge consecutive plain chars to reduce span count
      if (tokens.length > 0 && tokens[tokens.length - 1].c === "#c9d1d9") {
        tokens[tokens.length - 1].v += rem[0];
      } else {
        tokens.push({ v: rem[0], c: "#c9d1d9" });
      }
      rem = rem.slice(1);
    }
  }
  return tokens;
}

function SyntaxHighlight({ code, lang = "cypher" }) {
  const lines = code.split("\n");
  return (
    <div style={styles.codeBlock}>
      {lines.map((line, i) => {
        const tokens = tokenizeLine(line, lang);
        return (
          <div key={i} style={{ minHeight: "1.5em" }}>
            {tokens.length === 0
              ? <span>&nbsp;</span>
              : tokens.map((t, j) => <span key={j} style={{ color: t.c }}>{t.v}</span>)}
          </div>
        );
      })}
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────
const USE_CASE = {
  title: "E-Commerce Intelligence Graph",
  subtitle: "Supply Chain · Customer 360 · Semantic Search",
  description:
    "A unified knowledge graph connecting customers, products, orders, suppliers and reviews — enriched with vector embeddings to power GraphRAG-style semantic retrieval and recommendation.",
  nodes: [
    { label: "Customer", color: C.cyan, props: ["id", "name", "email", "segment", "region"], count: "~500K" },
    { label: "Product", color: C.green, props: ["sku", "name", "description", "price", "embedding"], count: "~80K" },
    { label: "Category", color: C.amber, props: ["id", "name", "level", "path"], count: "~1.2K" },
    { label: "Order", color: C.purple, props: ["orderId", "date", "status", "total"], count: "~3M" },
    { label: "Review", color: C.red, props: ["reviewId", "rating", "text", "embedding"], count: "~2M" },
    { label: "Supplier", color: "#34d399", props: ["id", "name", "country", "tier"], count: "~5K" },
    { label: "Warehouse", color: "#fb923c", props: ["id", "location", "capacity"], count: "~200" },
  ],
  edges: [
    { from: "Customer", to: "Order", type: "PLACED", props: ["at"] },
    { from: "Order", to: "Product", type: "CONTAINS", props: ["qty", "unitPrice"] },
    { from: "Customer", to: "Review", type: "WROTE", props: ["at"] },
    { from: "Review", to: "Product", type: "ABOUT", props: [] },
    { from: "Product", to: "Category", type: "BELONGS_TO", props: ["primary"] },
    { from: "Supplier", to: "Product", type: "SUPPLIES", props: ["leadDays", "cost"] },
    { from: "Supplier", to: "Warehouse", type: "SHIPS_TO", props: ["frequency"] },
    { from: "Product", to: "Product", type: "SIMILAR_TO", props: ["score"] },
    { from: "Customer", to: "Customer", type: "REFERRED", props: ["code"] },
  ],
};

const PIPELINE_STEPS = [
  {
    id: 1,
    title: "Schema Bootstrap & Config",
    color: C.cyan,
    apoc: ["apoc.schema.assert", "apoc.config.list"],
    desc: "Create indexes, constraints, and verify APOC config before loading.",
    code: `// ── Step 1: Schema Bootstrap ────────────────────────────────────────────
// Create uniqueness constraints & full-text indexes

CALL apoc.schema.assert(
  {
    Product:  ['sku'],
    Customer: ['id'],
    Order:    ['orderId'],
    Supplier: ['id'],
    Review:   ['reviewId']
  },
  {
    Product:  [['sku']],
    Customer: [['id']],
    Order:    [['orderId']]
  }
) YIELD label, key, action
RETURN label, key, action;

// Full-text index for semantic pre-filtering
CREATE FULLTEXT INDEX product_search IF NOT EXISTS
FOR (p:Product) ON EACH [p.name, p.description];

CREATE FULLTEXT INDEX review_search IF NOT EXISTS
FOR (r:Review) ON EACH [r.text];

// Verify APOC availability
CALL apoc.config.list()
YIELD key, value
WHERE key STARTS WITH 'apoc.import'
RETURN key, value;`,
    lang: "cypher",
  },
  {
    id: 2,
    title: "Load Products from JSON",
    color: C.green,
    apoc: ["apoc.load.json", "apoc.periodic.iterate", "apoc.merge.node"],
    desc: "Stream product JSON, batch-merge nodes with dynamic properties.",
    code: `// ── Step 2: Load Products ───────────────────────────────────────────────
// Source: REST API / S3 JSON export

CALL apoc.periodic.iterate(
  // ① Data source query — paginated JSON endpoint
  "CALL apoc.load.json(
     'https://data.mystore.com/api/products?page={page}&size=500'
   ) YIELD value AS row",

  // ② Inner write query — merge + set props atomically
  "MERGE (p:Product {sku: row.sku})
   ON CREATE SET
     p.name        = row.name,
     p.description = row.description,
     p.price       = toFloat(row.price),
     p.brand       = row.brand,
     p.createdAt   = apoc.date.parse(row.created_at, 'ms', 'yyyy-MM-dd'),
     p.active      = row.active
   ON MATCH SET
     p.price       = toFloat(row.price),
     p.active      = row.active
   WITH p, row
   // ③ Attach Category node inline
   MERGE (c:Category {id: row.category_id})
     ON CREATE SET c.name = row.category_name
   MERGE (p)-[:BELONGS_TO {primary: true}]->(c)",

  // ④ Batch config
  {batchSize: 500, parallel: false, retries: 3,
   params: {page: 0}, iterateList: false}
) YIELD batches, total, errorMessages
RETURN batches, total, errorMessages;`,
    lang: "cypher",
  },
  {
    id: 3,
    title: "Load Customers from CSV",
    color: C.amber,
    apoc: ["apoc.load.csv", "apoc.periodic.iterate", "apoc.merge.node"],
    desc: "Ingest CSV customer exports using streaming, skipping headers automatically.",
    code: `// ── Step 3: Load Customers (CSV) ────────────────────────────────────────
// Assumes CSV columns: id, name, email, segment, region, referrer_id

CALL apoc.periodic.iterate(
  "CALL apoc.load.csv(
     'file:///import/customers_2025.csv',
     {header: true, sep: ',', quoteChar: '\"',
      nullValues: ['', 'NULL', 'null']}
   ) YIELD map AS row",

  "MERGE (c:Customer {id: row.id})
   ON CREATE SET
     c.name      = row.name,
     c.email     = toLower(row.email),
     c.segment   = row.segment,
     c.region    = row.region,
     c.createdAt = apoc.date.parse(row.signup_date,'ms','yyyy-MM-dd')
   ON MATCH SET
     c.segment = row.segment,
     c.region  = row.region
   // Referral relationship (self-edge)
   WITH c, row
   WHERE row.referrer_id IS NOT NULL
   MERGE (ref:Customer {id: row.referrer_id})
   MERGE (ref)-[:REFERRED {code: row.referral_code}]->(c)",

  {batchSize: 1000, parallel: false, retries: 2}
) YIELD batches, total, timeTaken, errorMessages
RETURN batches, total,
       apoc.number.format(timeTaken / 1000.0, '#.##') + 's' AS duration,
       errorMessages;`,
    lang: "cypher",
  },
  {
    id: 4,
    title: "Load Orders & Line Items",
    color: C.purple,
    apoc: ["apoc.load.json", "apoc.periodic.iterate", "apoc.create.relationship"],
    desc: "Reconstruct order graph: Customer → Order → Products with quantities.",
    code: `// ── Step 4: Orders + Line Items ─────────────────────────────────────────

CALL apoc.periodic.iterate(
  // Orders JSON (nested line items)
  "CALL apoc.load.json('file:///import/orders_batch.jsonl')
   YIELD value AS order",

  "// Create Order node
   MERGE (o:Order {orderId: order.id})
   ON CREATE SET
     o.date   = apoc.date.parse(order.placed_at,'ms',\"yyyy-MM-dd'T'HH:mm:ss\"),
     o.status = order.status,
     o.total  = toFloat(order.total_amount),
     o.currency = order.currency

   // Link Customer → Order
   WITH o, order
   MATCH (c:Customer {id: order.customer_id})
   MERGE (c)-[:PLACED {at: o.date}]->(o)

   // Expand line items
   WITH o, order
   UNWIND order.items AS item
   MATCH (p:Product {sku: item.sku})
   MERGE (o)-[r:CONTAINS]->(p)
   ON CREATE SET
     r.qty       = toInteger(item.quantity),
     r.unitPrice = toFloat(item.unit_price),
     r.discount  = toFloat(coalesce(item.discount, 0))",

  {batchSize: 200, parallel: false, retries: 3}
) YIELD batches, total, errorMessages
RETURN batches, total, errorMessages;`,
    lang: "cypher",
  },
  {
    id: 5,
    title: "Load Suppliers & Inventory",
    color: "#34d399",
    apoc: ["apoc.load.json", "apoc.periodic.iterate", "apoc.merge.relationship"],
    desc: "Connect Suppliers → Products → Warehouses with lead-time attributes.",
    code: `// ── Step 5: Suppliers & Warehouse Inventory ─────────────────────────────

// 5a. Create Supplier nodes
CALL apoc.load.json('file:///import/suppliers.json')
YIELD value AS s
MERGE (sup:Supplier {id: s.supplier_id})
ON CREATE SET
  sup.name    = s.name,
  sup.country = s.country,
  sup.tier    = s.tier,
  sup.contact = s.contact_email;

// 5b. Supplier → Product supply edges (batch)
CALL apoc.periodic.iterate(
  "CALL apoc.load.json('file:///import/supply_catalog.json')
   YIELD value AS row",

  "MATCH (sup:Supplier {id: row.supplier_id})
   MATCH (p:Product   {sku: row.product_sku})
   MERGE (sup)-[r:SUPPLIES]->(p)
   ON CREATE SET
     r.leadDays  = toInteger(row.lead_days),
     r.unitCost  = toFloat(row.unit_cost),
     r.moq       = toInteger(row.min_order_qty)
   // Warehouse shipping routes
   WITH sup, row
   UNWIND row.warehouses AS wh
   MERGE (w:Warehouse {id: wh.id})
     ON CREATE SET w.location = wh.location, w.capacity = wh.capacity
   MERGE (sup)-[:SHIPS_TO {frequency: wh.frequency}]->(w)",

  {batchSize: 300, parallel: false}
) YIELD batches, total
RETURN batches, total;`,
    lang: "cypher",
  },
  {
    id: 6,
    title: "Load Reviews & Sentiment",
    color: C.red,
    apoc: ["apoc.load.csv", "apoc.periodic.iterate", "apoc.create.node"],
    desc: "Ingest review text, rating, and pre-computed sentiment score.",
    code: `// ── Step 6: Reviews ─────────────────────────────────────────────────────

CALL apoc.periodic.iterate(
  "CALL apoc.load.csv('file:///import/reviews.csv',
     {header: true, sep: ',', nullValues: ['']})
   YIELD map AS row
   WHERE row.review_id IS NOT NULL",

  "MERGE (r:Review {reviewId: row.review_id})
   ON CREATE SET
     r.rating    = toInteger(row.rating),
     r.text      = row.review_text,
     r.sentiment = toFloat(row.sentiment_score),   // pre-computed externally
     r.helpful   = toInteger(coalesce(row.helpful_votes, '0')),
     r.createdAt = apoc.date.parse(row.created_at,'ms','yyyy-MM-dd')

   // Review → Product
   WITH r, row
   MATCH (p:Product  {sku:  row.product_sku})
   MERGE (r)-[:ABOUT]->(p)

   // Customer → Review
   WITH r, row
   MATCH (c:Customer {id: row.customer_id})
   MERGE (c)-[:WROTE {at: r.createdAt}]->(r)",

  {batchSize: 500, parallel: false, retries: 2}
) YIELD batches, total, errorMessages
RETURN batches, total, errorMessages;`,
    lang: "cypher",
  },
  {
    id: 7,
    title: "Post-Load Validation & Stats",
    color: C.cyan,
    apoc: ["apoc.meta.stats", "apoc.meta.schema", "apoc.util.validate"],
    desc: "Introspect the loaded graph and assert data quality invariants.",
    code: `// ── Step 7: Validation ──────────────────────────────────────────────────

// 7a. Node & relationship counts per label
CALL apoc.meta.stats()
YIELD labels, relTypesCount, nodeCount, relCount
RETURN labels, relTypesCount, nodeCount, relCount;

// 7b. Full schema snapshot (labels, prop types, rel types)
CALL apoc.meta.schema()
YIELD value
RETURN value;

// 7c. Orphan check — Orders without a Customer
MATCH (o:Order)
WHERE NOT ()-[:PLACED]->(o)
CALL apoc.util.validate(
  count(o) > 0,
  'Found %d orphaned Orders — check customer load!',
  [count(o)]
)
RETURN count(o) AS orphanedOrders;

// 7d. Data freshness check
MATCH (o:Order)
WITH max(o.date) AS latestOrder
CALL apoc.util.validate(
  latestOrder < apoc.date.add(apoc.date.currentTimestamp(), 'ms', -2, 'd'),
  'Order data may be stale — latest: %s',
  [apoc.date.format(latestOrder,'ms','yyyy-MM-dd HH:mm')]
)
RETURN apoc.date.format(latestOrder,'ms','yyyy-MM-dd HH:mm') AS latestOrderDate;`,
    lang: "cypher",
  },
  {
    id: 8,
    title: "Export Graph for Embedding",
    color: C.amber,
    apoc: ["apoc.export.json.query", "apoc.path.subgraphAll"],
    desc: "Export Product & Review nodes enriched with graph context for vectorisation.",
    code: `// ── Step 8: Export Nodes for Embedding ──────────────────────────────────
// Builds a rich text context per Product by pulling in adjacent graph data

CALL apoc.export.json.query(
  "MATCH (p:Product)
   // Aggregate categories, top review snippets, supplier names
   OPTIONAL MATCH (p)-[:BELONGS_TO]->(c:Category)
   OPTIONAL MATCH (r:Review)-[:ABOUT]->(p)
   OPTIONAL MATCH (sup:Supplier)-[:SUPPLIES]->(p)
   WITH p,
        collect(DISTINCT c.name)   AS categories,
        collect(DISTINCT sup.name) AS suppliers,
        [rv IN collect(r) WHERE rv.rating >= 4 | rv.text][..3] AS topReviews,
        avg(r.rating) AS avgRating
   RETURN p.sku           AS id,
          p.name          AS name,
          p.description   AS description,
          p.price         AS price,
          avgRating,
          categories,
          suppliers,
          topReviews,
          // Combined text blob for embedding
          p.name + '. ' +
          coalesce(p.description,'') + ' ' +
          apoc.text.join(categories, ', ') + '. ' +
          apoc.text.join(topReviews, ' ')  AS embedText",

  'file:///export/products_for_embedding.json',
  {stream: false, batchSize: 1000}
) YIELD file, source, format, nodes, rels, properties, time
RETURN file, nodes, properties, time;`,
    lang: "cypher",
  },
];

const GRAPHRAG_CODE = {
  embed: `# embed_products.py
# PURPOSE: Read graph-enriched JSONL exported by APOC (Step 8), generate
#          OpenAI vector embeddings, persist them to Weaviate (HNSW search)
#          AND back to Neo4j Product nodes (native vector index queries).
# FLOW:  load_products -> embed_batch -> upsert_weaviate
#                                     -> write_embeddings_to_neo4j

import json, asyncio, httpx
from openai import AsyncOpenAI   # async client for concurrent embedding calls
import weaviate                   # Weaviate v4 Python client
from neo4j import AsyncGraphDatabase  # async Neo4j driver for non-blocking writes

# ---- Configuration constants --------------------------------------------
# text-embedding-3-large: OpenAI's highest-quality model (1536 dims).
# Produces better semantic clusters than ada-002 for product descriptions.
EMBEDDING_MODEL = "text-embedding-3-large"

# Neo4j Bolt URI -- update to your AuraDB connection string for cloud.
NEO4J_URI       = "bolt://localhost:7687"
NEO4J_USER, NEO4J_PASS = "neo4j", "password"

# Weaviate defaults to port 8080; run with Docker: -p 8080:8080.
WEAVIATE_URL    = "http://localhost:8080"

# 100 texts per OpenAI API call is a safe default.
# Increase to 300 if your rate limits allow higher throughput.
BATCH_SIZE      = 100

# ---- Initialise clients once at module level (reused across all batches) -
openai_client   = AsyncOpenAI()           # reads OPENAI_API_KEY from env var
weaviate_client = weaviate.connect_to_local()  # connects to localhost:8080

# ---- 1. Read JSONL export produced by APOC Step 8 ----------------------
# apoc.export.json.query writes one JSON object per line (JSONL format).
# We skip blank lines defensively to avoid json.loads errors.
def load_products(path: str) -> list[dict]:
    with open(path) as f:
        return [json.loads(line) for line in f if line.strip()]

# ---- 2. Generate embeddings for a batch of texts -----------------------
# Sends all texts in ONE API request -- far more efficient than one call
# per product. The API returns embeddings in the same order as the input,
# so zip(products, embeddings) is safe and correct.
async def embed_batch(texts: list[str]) -> list[list[float]]:
    response = await openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,      # list[str] -- one entry per product
        dimensions=1536,  # must match Weaviate and Neo4j vector index dims
    )
    # response.data is a list of Embedding objects; extract raw float lists
    return [item.embedding for item in response.data]

# ---- 3. Upsert product vectors into Weaviate ----------------------------
# weaviate.util.generate_uuid5(sku) creates a deterministic UUID from the
# product SKU. This makes re-runs idempotent: the same SKU overwrites its
# Weaviate object rather than creating a duplicate entry.
def upsert_weaviate(collection, products: list[dict], embeddings: list):
    # collection.batch.dynamic() auto-flushes when its internal buffer fills,
    # batching HTTP requests to Weaviate efficiently without manual tuning.
    with collection.batch.dynamic() as batch:
        for product, vector in zip(products, embeddings):
            batch.add_object(
                properties={
                    "sku":         product["id"],
                    "name":        product["name"],
                    "description": product.get("description", ""),
                    "categories":  product.get("categories", []),
                    "suppliers":   product.get("suppliers", []),
                    "price":       float(product.get("price", 0)),
                    "avgRating":   float(product.get("avgRating") or 0),
                    # embedText stores the full input string for traceability
                    # and allows re-embedding checks without re-querying Neo4j
                    "embedText":   product["embedText"],
                },
                vector=vector,  # the 1536-dim float list from OpenAI
                uuid=weaviate.util.generate_uuid5(product["id"]),  # deterministic
            )

# ---- 4. Write embedding vectors back onto Neo4j Product nodes ----------
# Storing the vector in Neo4j enables native Cypher vector index queries
# (db.index.vector.queryNodes) without going through Weaviate -- useful
# for hybrid Cypher + vector queries in a single database hop.
# UNWIND batches all rows into one transaction instead of N round-trips.
async def write_embeddings_to_neo4j(session, products, embeddings):
    await session.run(
        """
        UNWIND $rows AS row
        MATCH (p:Product {sku: row.sku})
        SET p.embedding      = row.vector,
            p.embeddedAt     = timestamp(),
            p.embeddingModel = $model
        """,
        rows=[{"sku": p["id"], "vector": v}
              for p, v in zip(products, embeddings)],
        model=EMBEDDING_MODEL,
    )

# ---- 5. Main pipeline orchestrator -------------------------------------
# Iterates over products in BATCH_SIZE chunks: embed -> write Weaviate
# -> write Neo4j. Progress is printed after each batch. Both the Weaviate
# client and Neo4j driver are closed on exit to avoid connection leaks.
async def run():
    products   = load_products("export/products_for_embedding.json")
    collection = weaviate_client.collections.get("Product")
    neo4j_driver = AsyncGraphDatabase.driver(NEO4J_URI,
                       auth=(NEO4J_USER, NEO4J_PASS))

    async with neo4j_driver.session() as session:
        for i in range(0, len(products), BATCH_SIZE):
            batch      = products[i : i + BATCH_SIZE]
            texts      = [p["embedText"] for p in batch]  # extract text blobs
            embeddings = await embed_batch(texts)          # call OpenAI API

            upsert_weaviate(collection, batch, embeddings)          # -> Weaviate
            await write_embeddings_to_neo4j(session, batch, embeddings)  # -> Neo4j
            print(f"  Processed {min(i+BATCH_SIZE, len(products))}/{len(products)}")

    weaviate_client.close()   # release Weaviate HTTP connection pool
    await neo4j_driver.close()  # release Neo4j Bolt connection pool
    print("Embedding pipeline complete.")

if __name__ == "__main__":
    asyncio.run(run())`,

  schema: `# weaviate_schema.py
# PURPOSE: Create Weaviate collections for Product and Review nodes.
#          Run ONCE before the embedding pipeline (embed_products.py).
#          Re-running on an existing schema raises CollectionExists --
#          wrap in try/except for idempotent deployments.
#
# DESIGN DECISIONS:
#   vectorizer_config = none()  -->  we supply external OpenAI vectors;
#   Weaviate does NOT call any embedding service itself. This gives us full
#   control over the embedding model and avoids double-billing.
#
#   HNSW index: ef_construction=256, max_connections=32 is tuned for
#   >0.99 recall at moderate query speed. Lower ef_construction to speed
#   up index builds on large datasets at the cost of slight recall loss.
#
#   distance_metric = COSINE  -->  standard for OpenAI embedding vectors.
#   OpenAI normalises embeddings to unit length, so cosine = dot product.

import weaviate
import weaviate.classes as wvc  # shorthand for weaviate config classes

# Connect to local Weaviate instance (Docker: -p 8080:8080)
client = weaviate.connect_to_local()

# ---- Product Collection -------------------------------------------------
# Each Weaviate object = one Product node in Neo4j.
# The stored vector is the 1536-dim OpenAI embedding of embedText
# (name + description + categories + top reviews -- graph-enriched context).
client.collections.create(
    name="Product",

    # none() = we supply pre-computed vectors; Weaviate does NOT embed.
    # This decouples Weaviate from any specific embedding provider.
    vectorizer_config=wvc.config.Configure.Vectorizer.none(),

    # Properties mirror Neo4j node properties + what we filter in queries.
    # TEXT_ARRAY properties allow 'where categories contains X' filtering.
    properties=[
        wvc.config.Property(name="sku",         data_type=wvc.config.DataType.TEXT),
        wvc.config.Property(name="name",        data_type=wvc.config.DataType.TEXT),
        wvc.config.Property(name="description", data_type=wvc.config.DataType.TEXT),
        wvc.config.Property(name="categories",  data_type=wvc.config.DataType.TEXT_ARRAY),
        wvc.config.Property(name="suppliers",   data_type=wvc.config.DataType.TEXT_ARRAY),
        wvc.config.Property(name="price",       data_type=wvc.config.DataType.NUMBER),
        wvc.config.Property(name="avgRating",   data_type=wvc.config.DataType.NUMBER),
        wvc.config.Property(name="embedText",   data_type=wvc.config.DataType.TEXT),
    ],

    # HNSW vector index configuration:
    #   ef_construction=256  -- build quality; 2x default; more accurate graph edges
    #   max_connections=32   -- degree per node; sweet-spot for 1536-dim vectors
    #   COSINE similarity    -- normalised dot product; best for OpenAI embeddings
    vector_index_config=wvc.config.Configure.VectorIndex.hnsw(
        distance_metric=wvc.config.VectorDistances.COSINE,
        ef_construction=256,
        max_connections=32,
    ),
)

# ---- Review Collection --------------------------------------------------
# Reviews are embedded separately so we can do per-review semantic search
# e.g. "find all reviews mentioning battery life" independent of product
# similarity. The productSku property links back to Neo4j for graph joins.
client.collections.create(
    name="Review",
    vectorizer_config=wvc.config.Configure.Vectorizer.none(),
    properties=[
        wvc.config.Property(name="reviewId",   data_type=wvc.config.DataType.TEXT),
        wvc.config.Property(name="productSku", data_type=wvc.config.DataType.TEXT),
        wvc.config.Property(name="rating",     data_type=wvc.config.DataType.INT),
        # Pre-computed sentiment: -1.0 (very negative) to +1.0 (very positive)
        wvc.config.Property(name="sentiment",  data_type=wvc.config.DataType.NUMBER),
        wvc.config.Property(name="text",       data_type=wvc.config.DataType.TEXT),
    ],
)

print("Weaviate schema created: Product + Review collections ready.")
client.close()  # release the underlying HTTP connection pool`,

  rag: `# graphrag_retriever.py
# PURPOSE: Implements the full GraphRAG (Graph Retrieval-Augmented Generation)
#          query pipeline. Combines Weaviate vector search with Neo4j graph
#          traversal to produce richer context than plain RAG can provide.
#
# PIPELINE (5 steps):
#   1. embed_query()    -- embed the user question (same model as products)
#   2. vector_search()  -- Weaviate HNSW: find top-K semantically similar SKUs
#   3. graph_enrich()   -- Neo4j: traverse 1-2 hops to get categories,
#                          suppliers, reviews, co-purchased products
#   4. build_prompt()   -- assemble a structured LLM prompt with all context
#   5. graphrag_query() -- call GPT-4o and return the grounded answer
#
# WHY GraphRAG > Plain RAG:
#   Plain RAG stops at step 2 and feeds only matching text snippets to the LLM.
#   GraphRAG step 3 adds graph context (suppliers, co-purchases, category
#   hierarchy, review sentiment) that is NOT in the product text but is
#   essential for accurate, trustworthy answers.

import json
from openai import OpenAI    # synchronous client for request-response flow
import weaviate
from neo4j import GraphDatabase

openai  = OpenAI()                  # reads OPENAI_API_KEY from environment
wv      = weaviate.connect_to_local()  # Weaviate at localhost:8080
driver  = GraphDatabase.driver("bolt://localhost:7687",
                               auth=("neo4j", "password"))

# Must match the model used in embed_products.py!
# Vectors from different models are NOT comparable -- changing the model
# requires re-embedding ALL products before queries will work correctly.
EMBEDDING_MODEL = "text-embedding-3-large"
CHAT_MODEL      = "gpt-4o"   # GPT-4o: best instruction-following + reasoning

# ---- 1. Embed the user question -----------------------------------------
# We use the SAME model as the product embeddings so the vector spaces are
# aligned. Cosine similarity between the question vector and product vectors
# is then a meaningful semantic measure.
def embed_query(text: str) -> list[float]:
    r = openai.embeddings.create(model=EMBEDDING_MODEL, input=text)
    return r.data[0].embedding  # 1536-dim float list

# ---- 2. Weaviate vector search --> top-K candidate product SKUs ---------
# near_vector() runs approximate nearest-neighbour search on the HNSW index.
# We only retrieve SKUs here -- the full enrichment happens in Neo4j (step 3)
# because the graph contains context that Weaviate's schema does not store.
# top_k=8 is a balance: enough candidates for diverse results, few enough
# that Neo4j graph traversal stays fast.
def vector_search(query_vec: list[float], top_k: int = 8) -> list[str]:
    collection = wv.collections.get("Product")
    results = collection.query.near_vector(
        near_vector=query_vec,
        limit=top_k,
        return_properties=["sku", "name", "avgRating"],
        return_metadata=weaviate.classes.query.MetadataQuery(distance=True),
    )
    return [obj.properties["sku"] for obj in results.objects]

# ---- 3. Neo4j graph traversal -- enrich candidates with graph context ---
# This is what distinguishes GraphRAG from plain RAG. For each candidate SKU
# we traverse up to 2 hops in the knowledge graph to collect:
#   - Categories      (topical context: "Electronics > Audio > Headphones")
#   - Suppliers       (sourcing context: "Available from TechDistrib, GlobalParts")
#   - Top reviews     (4-5 star verbatim reviews: real customer voice)
#   - Co-purchased    (collaborative filter: "people also bought X with this")
# All of this is invisible to vector similarity but essential for good answers.
GRAPH_ENRICHMENT = """
MATCH (p:Product)
WHERE p.sku IN $skus

OPTIONAL MATCH (p)-[:BELONGS_TO]->(c:Category)
OPTIONAL MATCH (sup:Supplier)-[:SUPPLIES]->(p)

OPTIONAL MATCH (r:Review)-[:ABOUT]->(p)
  WHERE r.rating >= 4

OPTIONAL MATCH (o:Order)-[:CONTAINS]->(p)
OPTIONAL MATCH (o)-[:CONTAINS]->(co:Product)
  WHERE co.sku <> p.sku

WITH p,
     collect(DISTINCT c.name)   AS categories,
     collect(DISTINCT sup.name) AS suppliers,
     [rv IN collect(DISTINCT r) | rv.text][..2] AS topReviews,
     avg(r.rating) AS avgRating,
     collect(DISTINCT co.name)[..4] AS coPurchased

RETURN p.sku        AS sku,
       p.name       AS name,
       p.price      AS price,
       categories,
       suppliers,
       topReviews,
       round(avgRating, 1)  AS avgRating,
       coPurchased
"""

def graph_enrich(skus: list[str]) -> list[dict]:
    # Run the enrichment query with the SKU list as a Cypher parameter.
    # Using $skus prevents injection and allows Neo4j to plan the query once
    # and execute it for all SKUs in a single database round-trip.
    with driver.session() as session:
        result = session.run(GRAPH_ENRICHMENT, skus=skus)
        return [dict(r) for r in result]

# ---- 4. Build the LLM prompt with structured graph context --------------
# Each product is formatted as an indented block with all graph context.
# The system instruction restricts the LLM to the retrieved context ONLY --
# this is the key "grounding" mechanism that prevents hallucination.
# temperature=0.2 (set in step 5) further reduces creative invention.
def build_prompt(question: str, graph_context: list[dict]) -> str:
    ctx_blocks = []
    for p in graph_context:
        block = (
            f"Product: {p['name']} (SKU: {p['sku']}, \${p['price']:.2f})\n"
            f"  Categories : {chr(44).join(p['categories'])}\n"
            f"  Suppliers  : {chr(44).join(p['suppliers'])}\n"
            f"  Avg Rating : {p['avgRating']}\n"
            f"  Top Reviews: {chr(124).join(p['topReviews'])}\n"
            f"  Often Bought With: {chr(44).join(p['coPurchased'])}\n"
        )
        ctx_blocks.append(block)

    return ("You are a helpful e-commerce assistant with access to a product\n"
            "knowledge graph. Use ONLY the context below to answer the question.\n"
            "Cite product names and ratings when relevant.\n\n"
            "=== GRAPH CONTEXT ===\n"
            + "".join(ctx_blocks)
            + "=== USER QUESTION ===\n"
            + question)

# ---- 5. End-to-end GraphRAG entry point --------------------------------
# Single function that orchestrates all four steps.
# temperature=0.2 keeps answers factual and reproducible across runs.
def graphrag_query(question: str) -> str:
    query_vec      = embed_query(question)           # step 1: embed
    candidate_skus = vector_search(query_vec, top_k=8)  # step 2: vector search
    graph_context  = graph_enrich(candidate_skus)   # step 3: graph traversal
    prompt         = build_prompt(question, graph_context)  # step 4: prompt

    response = openai.chat.completions.create(
        model=CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,  # low = factual, high = creative; 0.2 reduces hallucination
    )
    return response.choices[0].message.content

# ---- Example ------------------------------------------------------------
if __name__ == "__main__":
    q = "What are the best-rated eco-friendly products under $50?"
    print("Question:", q)
    print()
    print(graphrag_query(q))`,
};

// ── Sub-components ─────────────────────────────────────────────────────────
function NodeCard({ node }) {
  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${node.color}33`,
      borderTop: `3px solid ${node.color}`,
      borderRadius: 8,
      padding: 16,
      minWidth: 170,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 700, color: node.color, fontSize: 14 }}>{node.label}</span>
        <span style={{ ...styles.badge(node.color), fontSize: 10 }}>{node.count}</span>
      </div>
      <div style={styles.label}>Properties</div>
      {node.props.map(p => (
        <div key={p} style={{ fontFamily: mono, fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
          · {p}
        </div>
      ))}
    </div>
  );
}

function EdgeRow({ edge }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 16px", borderBottom: `1px solid ${C.faint}`,
      flexWrap: "wrap",
    }}>
      <span style={styles.pill(C.cyan)}>{edge.from}</span>
      <span style={{ color: C.muted, fontFamily: mono, fontSize: 11 }}>──</span>
      <span style={styles.pill(C.amber)}>{edge.type}</span>
      <span style={{ color: C.muted, fontFamily: mono, fontSize: 11 }}>──▶</span>
      <span style={styles.pill(C.green)}>{edge.to}</span>
      {edge.props.length > 0 && (
        <span style={{ color: C.muted, fontFamily: mono, fontSize: 11, marginLeft: 4 }}>
          [{edge.props.join(", ")}]
        </span>
      )}
    </div>
  );
}

function PipelineStep({ step, isOpen, onToggle }) {
  return (
    <div style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", padding: "18px 24px",
          display: "flex", alignItems: "center", gap: 16,
          background: "transparent", border: "none",
          cursor: "pointer", color: C.text, textAlign: "left",
        }}>
        <div style={styles.stepCircle(step.color)}>{step.id}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{step.title}</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{step.desc}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {step.apoc.map(a => (
            <span key={a} style={{ ...styles.badge(step.color), fontSize: 10 }}>{a}</span>
          ))}
        </div>
        <div style={{ color: C.muted, fontSize: 18, marginLeft: 8, flexShrink: 0 }}>
          {isOpen ? "▲" : "▼"}
        </div>
      </button>
      {isOpen && (
        <div style={{ padding: "0 24px 24px" }}>
          <SyntaxHighlight code={step.code} lang={step.lang} />
        </div>
      )}
    </div>
  );
}

function ArchDiagram() {
  const boxes = [
    { label: "Raw Data Sources", sub: "CSV · JSON · REST API · RDBMS", color: C.muted, x: 0 },
    { label: "APOC Data Pipeline", sub: "apoc.load · apoc.periodic.iterate\napoc.merge · apoc.schema.assert", color: C.cyan, x: 1 },
    { label: "Neo4j Knowledge Graph", sub: "Nodes · Relationships\nIndexes · Constraints", color: C.green, x: 2 },
    { label: "Embedding Service", sub: "OpenAI text-embedding-3\nor local model", color: C.amber, x: 3 },
    { label: "Weaviate Vector DB", sub: "HNSW Index\nNear-vector search", color: C.purple, x: 4 },
    { label: "GraphRAG Retriever", sub: "Vector search → Graph traversal\n→ LLM generation", color: C.red, x: 5 },
  ];

  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 0, minWidth: 900 }}>
        {boxes.map((b, i) => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              flex: 1,
              background: b.color + "14",
              border: `1px solid ${b.color}44`,
              borderRadius: 8,
              padding: "16px 14px",
              textAlign: "center",
              minHeight: 90,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{ color: b.color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{b.label}</div>
              <div style={{ color: C.muted, fontSize: 11, fontFamily: mono, whiteSpace: "pre-line", lineHeight: 1.5 }}>{b.sub}</div>
            </div>
            {i < boxes.length - 1 && (
              <div style={{ color: C.muted, fontSize: 18, padding: "0 4px", flexShrink: 0 }}>→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
const TABS = ["Overview", "Graph Schema", "APOC Pipeline", "Vector Embedding", "GraphRAG Query"];

export default function App() {
  const [tab, setTab] = useState(0);
  const [openSteps, setOpenSteps] = useState({ 1: true });
  const [ragTab, setRagTab] = useState(0);

  const toggleStep = (id) =>
    setOpenSteps(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={styles.root}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={styles.badge(C.cyan)}>GraphRAG</span>
              <span style={styles.badge(C.green)}>Neo4j + APOC</span>
              <span style={styles.badge(C.purple)}>Weaviate</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.03em", color: C.text }}>
              E-Commerce Intelligence Graph
            </h1>
            <p style={{ color: C.muted, margin: "4px 0 0", fontSize: 13 }}>
              APOC Data Pipeline · Knowledge Graph · Vector Search · GraphRAG
            </p>
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 6, marginTop: 20, flexWrap: "wrap" }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={styles.tab(tab === i)}>{t}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "28px 40px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ── TAB 0: Overview ── */}
        {tab === 0 && (
          <div>
            <div style={styles.card}>
              <div style={styles.label}>Business Use Case</div>
              <div style={styles.sectionTitle}>{USE_CASE.title}</div>
              <p style={{ color: C.muted, margin: "8px 0 20px", lineHeight: 1.7, fontSize: 13 }}>{USE_CASE.description}</p>
              <div style={styles.label}>Business Goals</div>
              {[
                { icon: "🔍", t: "Semantic Product Search", d: "Natural-language queries resolved via vector + graph context" },
                { icon: "🛒", t: "Co-Purchase Recommendations", d: "Graph-traversal over ORDER→CONTAINS to surface affinity pairs" },
                { icon: "🚚", t: "Supply Chain Risk Analysis", d: "Trace SUPPLIER→PRODUCT paths; identify single-source dependencies" },
                { icon: "⭐", t: "Review Intelligence", d: "Aggregate review embeddings per product for sentiment-aware retrieval" },
                { icon: "👤", t: "Customer 360", d: "Full view of each customer's orders, reviews, referrals and segment" },
              ].map(g => (
                <div key={g.t} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: `1px solid ${C.faint}` }}>
                  <span style={{ fontSize: 20 }}>{g.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{g.t}</div>
                    <div style={{ color: C.muted, fontSize: 12 }}>{g.d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.card}>
              <div style={styles.label}>End-to-End Architecture</div>
              <ArchDiagram />
            </div>

            <div style={styles.card}>
              <div style={styles.label}>Tech Stack</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {[
                  ["Neo4j 5.x", C.cyan], ["APOC Core 2025", C.cyan],
                  ["Weaviate v4", C.purple], ["OpenAI Embeddings", C.amber],
                  ["GPT-4o", C.amber], ["Python 3.12", C.green],
                  ["neo4j-driver", C.green], ["weaviate-client v4", C.purple],
                  ["openai-python", C.amber], ["asyncio", C.muted],
                ].map(([name, color]) => (
                  <span key={name} style={styles.pill(color)}>{name}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: Schema ── */}
        {tab === 1 && (
          <div>
            <div style={styles.card}>
              <div style={styles.label}>Node Labels</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                {USE_CASE.nodes.map(n => <NodeCard key={n.label} node={n} />)}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.label}>Relationship Types</div>
              <div style={{ marginTop: 8, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                {USE_CASE.edges.map(e => <EdgeRow key={e.type + e.from} edge={e} />)}
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.label}>Cypher Schema Definition</div>
              <SyntaxHighlight lang="cypher" code={`// Constraints
CREATE CONSTRAINT product_sku   IF NOT EXISTS FOR (p:Product)  REQUIRE p.sku      IS UNIQUE;
CREATE CONSTRAINT customer_id   IF NOT EXISTS FOR (c:Customer) REQUIRE c.id       IS UNIQUE;
CREATE CONSTRAINT order_id      IF NOT EXISTS FOR (o:Order)    REQUIRE o.orderId  IS UNIQUE;
CREATE CONSTRAINT supplier_id   IF NOT EXISTS FOR (s:Supplier) REQUIRE s.id       IS UNIQUE;
CREATE CONSTRAINT review_id     IF NOT EXISTS FOR (r:Review)   REQUIRE r.reviewId IS UNIQUE;

// Indexes for frequent lookups
CREATE INDEX product_price      IF NOT EXISTS FOR (p:Product)  ON (p.price);
CREATE INDEX order_status       IF NOT EXISTS FOR (o:Order)    ON (o.status);
CREATE INDEX customer_segment   IF NOT EXISTS FOR (c:Customer) ON (c.segment);
CREATE INDEX review_rating      IF NOT EXISTS FOR (r:Review)   ON (r.rating);

// Vector index (Neo4j 5.15+)
CREATE VECTOR INDEX product_embedding IF NOT EXISTS
FOR (p:Product) ON (p.embedding)
OPTIONS {indexConfig: {
  \`vector.dimensions\`: 1536,
  \`vector.similarity_function\`: 'cosine'
}};`} />
            </div>
          </div>
        )}

        {/* ── TAB 2: Pipeline ── */}
        {tab === 2 && (
          <div>
            <div style={{ ...styles.card, background: C.cyanDim, border: `1px solid ${C.cyan}33` }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 700, color: C.cyan, marginBottom: 4 }}>APOC-Powered ETL Pipeline — 8 Steps</div>
                  <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.7 }}>
                    Each step is idempotent using <code style={{ fontFamily: mono, color: C.cyan }}>MERGE</code>.
                    Run the full pipeline on first load, then re-run individual steps for incremental updates.
                    Click any step to expand its Cypher code.
                  </div>
                </div>
              </div>
            </div>
            {PIPELINE_STEPS.map(step => (
              <PipelineStep
                key={step.id}
                step={step}
                isOpen={!!openSteps[step.id]}
                onToggle={() => toggleStep(step.id)}
              />
            ))}
          </div>
        )}

        {/* ── TAB 3: Embedding ── */}
        {tab === 3 && (
          <div>
            <div style={styles.card}>
              <div style={styles.label}>Embedding Strategy</div>
              <div style={styles.sectionTitle}>Graph-Enriched Text Embeddings</div>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, margin: "8px 0 20px" }}>
                Each Product's embedding is generated from a concatenated text blob that includes its name,
                description, category hierarchy, top-rated review snippets, and supplier names — all pulled
                via graph traversal before embedding. This gives vectors richer context than plain description text.
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
                {[
                  { label: "Model", val: "text-embedding-3-large", color: C.amber },
                  { label: "Dimensions", val: "1536", color: C.cyan },
                  { label: "Index Type", val: "HNSW (cosine)", color: C.purple },
                  { label: "Batch Size", val: "100 / call", color: C.green },
                  { label: "Storage", val: "Weaviate + Neo4j", color: C.red },
                ].map(m => (
                  <div key={m.label} style={{
                    background: m.color + "14", border: `1px solid ${m.color}33`,
                    borderRadius: 8, padding: "12px 18px", textAlign: "center",
                  }}>
                    <div style={{ color: m.color, fontWeight: 700, fontSize: 15 }}>{m.val}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {["Embedding Pipeline", "Weaviate Schema"].map((t, i) => (
                <button key={t} onClick={() => setRagTab(i)} style={styles.tab(ragTab === i)}>{t}</button>
              ))}
            </div>

            <div style={styles.card}>
              <SyntaxHighlight lang="python" code={ragTab === 0 ? GRAPHRAG_CODE.embed : GRAPHRAG_CODE.schema} />
            </div>
          </div>
        )}

        {/* ── TAB 4: GraphRAG ── */}
        {tab === 4 && (
          <div>
            <div style={styles.card}>
              <div style={styles.label}>GraphRAG Query Flow</div>
              <div style={styles.sectionTitle}>Vector Search ⊕ Graph Traversal ⊕ LLM Generation</div>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, margin: "8px 0 20px" }}>
                A user question is embedded → Weaviate finds semantically similar products →
                Neo4j enriches each candidate with its graph neighbourhood (categories, suppliers,
                co-purchased items, reviews) → the enriched context is passed to GPT-4o for generation.
              </p>
              <div style={{ display: "flex", gap: 0, overflowX: "auto", paddingBottom: 8 }}>
                {[
                  { n: "1", label: "User Query", color: C.cyan, icon: "💬" },
                  { n: "2", label: "Embed Query", color: C.amber, icon: "🔢" },
                  { n: "3", label: "Vector Search\n(Weaviate)", color: C.purple, icon: "🔍" },
                  { n: "4", label: "Graph Enrich\n(Neo4j APOC)", color: C.green, icon: "🕸️" },
                  { n: "5", label: "LLM Generate\n(GPT-4o)", color: C.red, icon: "✨" },
                ].map((s, i, arr) => (
                  <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ textAlign: "center", minWidth: 130 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: "50%",
                        background: s.color + "22", border: `2px solid ${s.color}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, margin: "0 auto 8px",
                      }}>{s.icon}</div>
                      <div style={{ color: s.color, fontWeight: 700, fontSize: 12, whiteSpace: "pre-line" }}>{s.label}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ color: C.muted, fontSize: 20, padding: "0 6px", marginBottom: 20 }}>→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.label}>GraphRAG Retriever — Full Code</div>
              <SyntaxHighlight lang="python" code={GRAPHRAG_CODE.rag} />
            </div>

            <div style={styles.card}>
              <div style={styles.label}>Example GraphRAG Cypher Queries</div>
              <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 13 }}>
                Native Neo4j vector similarity (5.15+)
              </div>
              <SyntaxHighlight lang="cypher" code={`// Find products similar to a given SKU using the built-in vector index
MATCH (base:Product {sku: 'ECO-1042'})
CALL db.index.vector.queryNodes(
  'product_embedding',  // index name
  10,                   // top-K
  base.embedding        // query vector
) YIELD node AS similar, score
WHERE score > 0.82
MATCH (similar)-[:BELONGS_TO]->(c:Category)
OPTIONAL MATCH (sup:Supplier)-[:SUPPLIES]->(similar)
RETURN similar.sku, similar.name, similar.price,
       score,
       collect(DISTINCT c.name)   AS categories,
       collect(DISTINCT sup.name) AS suppliers
ORDER BY score DESC;

// ── Hybrid: vector candidates + graph filter ─────────────────────────────
// "Find eco-friendly products under $50, often bought with camping gear"
MATCH (base:Product)-[:BELONGS_TO]->(c:Category {name: 'Camping'})
WITH collect(base)[..3] AS seeds
UNWIND seeds AS seed
CALL db.index.vector.queryNodes('product_embedding', 5, seed.embedding)
YIELD node AS candidate, score
WHERE candidate.price < 50 AND score > 0.78
MATCH (o:Order)-[:CONTAINS]->(seed)
MATCH (o)-[:CONTAINS]->(candidate)   // co-purchased filter
RETURN DISTINCT candidate.name, candidate.price, round(score,3) AS similarity
ORDER BY similarity DESC LIMIT 10;`} />
            </div>

            <div style={{ ...styles.card, background: C.purpleDim, border: `1px solid ${C.purple}33` }}>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ fontSize: 22 }}>🚀</span>
                <div>
                  <div style={{ fontWeight: 700, color: C.purple, marginBottom: 6 }}>GraphRAG vs. Plain RAG</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      ["Plain RAG", "Vector similarity only — misses graph structure, relationships, and multi-hop context", C.muted],
                      ["GraphRAG", "Vector search seeds candidates, graph traversal adds suppliers, co-purchases, category hierarchy and reviews — richer, more accurate answers", C.purple],
                    ].map(([t, d, c]) => (
                      <div key={t} style={{ background: C.panel, borderRadius: 6, padding: 14 }}>
                        <div style={{ color: c, fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{t}</div>
                        <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>{d}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
