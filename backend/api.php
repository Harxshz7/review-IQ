<?php
/**
 * ReviewIQ Retailer API - Final Version
 * Uses existing reviewiq_rich_demo.csv on server
 */

$CSV_FILE = "reviewiq_rich_demo.csv";
$DEFAULT_LIMIT = 100;
$MAX_LIMIT = 1000;

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get parameters
$limit = min(max(intval($_GET['limit'] ?? 10), 1), 100);
$offset = max(intval($_GET['offset'] ?? 0), 0);
$product = $_GET['product'] ?? null;

// Check if CSV file exists
if (!file_exists($CSV_FILE)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'CSV not found'
    ]);
    exit();
}

// Read and parse CSV file
$reviews = [];
$rowNumber = 0;

if (($handle = fopen($CSV_FILE, 'r')) === false) {
    throw new Exception('Cannot read CSV file');
}

// Read header row
$headers = fgetcsv($handle);
if ($headers === false) {
    fclose($handle);
    throw new Exception('Cannot read CSV headers');
}

// Clean headers (remove BOM, trim whitespace)
$headers = array_map(function($header) {
    $header = trim($header);
    // Remove BOM if present
    $header = preg_replace('/^\xEF\xBB\xBF/', '', $header);
    return $header;
}, $headers);

// Map flexible column names
$columnMap = [
    'review_text' => ['review_text', 'review', 'text', 'comment', 'feedback'],
    'product_name' => ['product_name', 'product', 'name', 'item'],
    'submitted_at' => ['submitted_at', 'date', 'created_at', 'timestamp'],
    'rating' => ['rating', 'stars', 'score']
];

// Find actual column indices
$columnIndices = [];
foreach ($columnMap as $target => $possibleNames) {
    foreach ($possibleNames as $name) {
        $index = array_search($name, $headers);
        if ($index !== false) {
            $columnIndices[$target] = $index;
            break;
        }
    }
}

// Read data rows
while (($row = fgetcsv($handle)) !== false) {
    if (empty(array_filter($row))) continue;
    
    $review = [
        'id' => ++$rowNumber,
        'product_name' => $row[$columnIndices['product_name']] ?? 'Unknown',
        'review_text' => $row[$columnIndices['review_text']] ?? '',
        'submitted_at' => $row[$columnIndices['submitted_at']] ?? date('Y-m-d'),
        'rating' => isset($row[$columnIndices['rating']]) ? intval($row[$columnIndices['rating']]) : null,
        'source' => 'retailer_api'
    ];
    
    if ($product === null || stripos($review['product_name'], $product) !== false) {
        $reviews[] = $review;
    }
}

fclose($handle);

// Paginate results
$reviews = array_slice($reviews, $offset, $limit);

echo json_encode([
    'success' => true,
    'source' => 'retailer_api',
    'retailer' => 'User Store',
    'product' => $reviews[0]['product_name'] ?? 'Product',
    'total' => count($reviews),
    'offset' => $offset,
    'limit' => $limit,
    'reviews' => $reviews
]);
?>
