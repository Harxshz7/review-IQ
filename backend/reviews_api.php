<?php
/**
 * ReviewIQ Retailer API
 * Production-ready PHP API for real-time review ingestion
 * 
 * Upload this file + your reviews.csv to your server
 * Set your API key below
 */

// ============== CONFIGURATION ==============
$API_KEY = "RQ_qwertysdfghjklmnbvcxsdfghjkvbn"; // Change this!
$CSV_FILE = "reviewiq_rich_demo.csv"; // Your reviews CSV file
$DEFAULT_LIMIT = 50;
$MAX_LIMIT = 500;
$LOG_FILE = "requests_log.txt";
// ===========================================

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

// Log request
function logRequest($ip, $method, $query) {
    global $LOG_FILE;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $ip $method " . json_encode($query) . "\n";
    file_put_contents($LOG_FILE, $logEntry, FILE_APPEND | LOCK_EX);
}

// Get client IP
$clientIP = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// Log this request
logRequest($clientIP, $_SERVER['REQUEST_METHOD'], $_GET);

// Validate API key
$providedKey = $_GET['api_key'] ?? '';
if ($providedKey !== $API_KEY) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized'
    ]);
    exit();
}

// Check if CSV file exists
if (!file_exists($CSV_FILE)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'CSV not found'
    ]);
    exit();
}

// Parse query parameters
$productFilter = $_GET['product'] ?? '';
$limit = min(max(intval($_GET['limit'] ?? $DEFAULT_LIMIT), 1), $MAX_LIMIT);
$offset = max(intval($_GET['offset'] ?? 0), 0);

// Read and parse CSV
function parseReviewsCSV($filename, $productFilter = '', $limit = 50, $offset = 0) {
    $reviews = [];
    $rowNumber = 0;
    
    if (($handle = fopen($filename, 'r')) === false) {
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
        $columnIndices[$target] = null;
        foreach ($possibleNames as $name) {
            $index = array_search($name, $headers);
            if ($index !== false) {
                $columnIndices[$target] = $index;
                break;
            }
        }
    }
    
    // Read data rows
    $currentRow = 0;
    $skippedRows = 0;
    
    while (($row = fgetcsv($handle)) !== false) {
        $currentRow++;
        
        // Skip empty rows
        if (empty(array_filter($row))) {
            continue;
        }
        
        // Apply offset
        if ($currentRow <= $offset) {
            continue;
        }
        
        // Apply limit
        if (count($reviews) >= $limit) {
            break;
        }
        
        // Extract data using column mapping
        $reviewData = [];
        foreach ($columnIndices as $field => $index) {
            $value = '';
            if ($index !== null && isset($row[$index])) {
                $value = trim($row[$index]);
            }
            $reviewData[$field] = $value;
        }
        
        // Skip if required fields missing
        if (empty($reviewData['review_text'])) {
            $skippedRows++;
            continue;
        }
        
        // Apply product filter
        if (!empty($productFilter) && !empty($reviewData['product_name'])) {
            if (stripos($reviewData['product_name'], $productFilter) === false) {
                $skippedRows++;
                continue;
            }
        }
        
        // Clean and validate data
        $review = [
            'id' => $currentRow,
            'product_name' => $reviewData['product_name'] ?: 'Unknown Product',
            'review_text' => $reviewData['review_text'],
            'submitted_at' => !empty($reviewData['submitted_at']) ? $reviewData['submitted_at'] : date('Y-m-d'),
            'rating' => !empty($reviewData['rating']) ? intval($reviewData['rating']) : null,
            'source' => 'retailer_api'
        ];
        
        // Validate rating
        if ($review['rating'] !== null && ($review['rating'] < 1 || $review['rating'] > 5)) {
            $review['rating'] = null;
        }
        
        // Validate date
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $review['submitted_at'])) {
            $review['submitted_at'] = date('Y-m-d');
        }
        
        $reviews[] = $review;
    }
    
    fclose($handle);
    
    return [
        'reviews' => $reviews,
        'skipped_rows' => $skippedRows,
        'total_rows' => $currentRow
    ];
}

try {
    $result = parseReviewsCSV($CSV_FILE, $productFilter, $limit, $offset);
    
    // Extract retailer and product info from first review
    $retailerName = 'Retailer'; // Default - could be set from config
    $productName = 'Product';   // Default
    
    if (!empty($result['reviews'])) {
        $firstReview = $result['reviews'][0];
        $productName = $firstReview['product_name'];
    }
    
    $response = [
        'success' => true,
        'source' => 'retailer_api',
        'retailer' => $retailerName,
        'product' => $productName,
        'total' => count($result['reviews']),
        'offset' => $offset,
        'limit' => $limit,
        'skipped_rows' => $result['skipped_rows'],
        'reviews' => $result['reviews']
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
