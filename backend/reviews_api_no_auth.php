<?php
/**
 * ReviewIQ Retailer API - No Auth Version
 * For testing purposes only
 */

$CSV_FILE = "reviewiq_rich_demo.csv";
$DEFAULT_LIMIT = 50;
$MAX_LIMIT = 500;

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
$limit = min(max(intval($_GET['limit'] ?? $DEFAULT_LIMIT), 1), $MAX_LIMIT);
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

// Read and return reviews
$reviews = [];
$handle = fopen($CSV_FILE, 'r');
$headers = fgetcsv($handle);

while (($row = fgetcsv($handle)) !== false) {
    if (empty(array_filter($row))) continue;
    
    $review = [
        'id' => count($reviews) + 1,
        'product_name' => $row[0] ?? 'Unknown',
        'review_text' => $row[1] ?? '',
        'submitted_at' => $row[2] ?? date('Y-m-d'),
        'rating' => isset($row[3]) ? intval($row[3]) : null,
        'source' => 'retailer_api'
    ];
    
    if ($product === null || stripos($review['product_name'], $product) !== false) {
        $reviews[] = $review;
    }
}

fclose($handle);

echo json_encode([
    'success' => true,
    'source' => 'retailer_api',
    'retailer' => 'Retailer',
    'product' => $reviews[0]['product_name'] ?? 'Product',
    'total' => count($reviews),
    'offset' => $offset,
    'limit' => $limit,
    'reviews' => array_slice($reviews, $offset, $limit)
]);
?>
