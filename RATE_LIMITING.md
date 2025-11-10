# Rate Limiting Documentation

## Overview

Rate limiting has been implemented to protect your PDF Screenshot API from abuse and ensure fair usage across all users.

## Configuration

### Global Limits
- **100 requests per minute** per IP address
- Applies to all endpoints
- Localhost (127.0.0.1) is whitelisted

### Endpoint-Specific Limits

#### `GET /` (Health Check)
- **Limit:** 100 requests per minute
- **Purpose:** Basic health monitoring

#### `POST /upload/pdf-screenshot` (PDF Processing)
- **Limit:** 10 requests per hour per IP
- **Purpose:** Prevent resource exhaustion (CPU, memory, R2 storage costs)
- **Reason:** PDF processing is resource-intensive

## Response Headers

Every API response includes rate limit information:

```http
x-ratelimit-limit: 10
x-ratelimit-remaining: 7
x-ratelimit-reset: 1640000000000
```

- `x-ratelimit-limit` - Maximum requests allowed in the time window
- `x-ratelimit-remaining` - Number of requests remaining
- `x-ratelimit-reset` - Unix timestamp (milliseconds) when limit resets

## Rate Limit Exceeded Response

When rate limit is exceeded, the API returns:

```json
HTTP 429 Too Many Requests

{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "PDF processing rate limit exceeded. Maximum 10 requests per hour. Try again in 45 minutes.",
  "retryAfter": 2700000
}
```

## Testing Rate Limits

### Test 1: Normal Request (Under Limit)

```bash
curl -i http://5.223.51.64:3000/upload/pdf-screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/test.pdf"}'

# Expected Response: 200 OK
# Headers will show:
# x-ratelimit-limit: 10
# x-ratelimit-remaining: 9
```

### Test 2: Exceed Rate Limit

```bash
# Run this 11 times quickly
for i in {1..11}; do
  echo "Request $i:"
  curl -i http://5.223.51.64:3000/upload/pdf-screenshot \
    -H "Content-Type: application/json" \
    -d '{"url": "https://example.com/test.pdf"}'
  echo "\n---\n"
done

# First 10 requests: 200 OK
# 11th request: 429 Too Many Requests
```

### Test 3: Check Rate Limit Headers

```bash
curl -I http://5.223.51.64:3000/

# Look for headers:
# x-ratelimit-limit: 100
# x-ratelimit-remaining: 99
# x-ratelimit-reset: 1640000060000
```

## Customizing Rate Limits

Edit `rate-limit.config.ts` to adjust limits:

```typescript
// Make PDF endpoint more restrictive (5 per hour)
export const pdfEndpointRateLimitConfig = {
  max: 5,
  timeWindow: "1 hour",
};

// Make it more lenient (20 per hour)
export const pdfEndpointRateLimitConfig = {
  max: 20,
  timeWindow: "1 hour",
};

// Different time window (10 per 15 minutes)
export const pdfEndpointRateLimitConfig = {
  max: 10,
  timeWindow: "15 minutes",
};
```

## Monitoring Rate Limits

### Check Logs

Rate limit violations are logged:

```bash
# View PM2 logs
pm2 logs pdf-screenshot

# Or check log files
tail -f logs/combined-0.log | grep "429"
```

### Track Abusive IPs

```bash
# Find IPs hitting rate limits
grep "429" logs/combined-0.log | grep -oP '\d+\.\d+\.\d+\.\d+' | sort | uniq -c | sort -rn
```

## Best Practices

### For API Users

1. **Check headers** - Monitor `x-ratelimit-remaining`
2. **Implement backoff** - Wait when limit is near
3. **Cache results** - Don't re-process same PDF
4. **Respect 429** - Wait before retrying

### For API Administrators

1. **Monitor abuse** - Track 429 responses
2. **Adjust limits** - Based on usage patterns
3. **Whitelist trusted IPs** - Add to `allowList`
4. **Consider authentication** - Implement API keys for higher limits

## Whitelist an IP

To whitelist specific IPs (no rate limits):

```typescript
// rate-limit.config.ts
export const globalRateLimitConfig = {
  // ... other config
  allowList: [
    "127.0.0.1",        // Localhost
    "192.168.1.100",    // Your office IP
    "10.0.0.50",        // Trusted server
  ],
};
```

## Different Limits Per User (Future)

When you add API key authentication, you can have per-key limits:

```typescript
export const premiumUserRateLimit = {
  max: 100,  // Premium users get 100/hour
  timeWindow: "1 hour",
};

export const freeUserRateLimit = {
  max: 10,   // Free users get 10/hour
  timeWindow: "1 hour",
};
```

## Troubleshooting

### Issue: Getting 429 but haven't made many requests

**Solution:** Another user on same network/proxy might be hitting limit
- Rate limits are per IP
- Shared IPs (office, VPN) share the limit

### Issue: Rate limit resets too slowly

**Solution:** Adjust time window in config
```typescript
timeWindow: "15 minutes"  // Instead of "1 hour"
```

### Issue: Need to reset limits for testing

**Solution:** Restart the server
```bash
pm2 restart pdf-screenshot
```

Rate limits are stored in memory and reset on restart.

## Production Considerations

### Distributed Rate Limiting (Multiple Servers)

If you scale to multiple servers, consider using Redis:

```bash
npm install @fastify/rate-limit ioredis
```

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379
});

await fastify.register(rateLimit, {
  redis: redis,
  // ... other config
});
```

This ensures rate limits work across all server instances.

## Summary

✅ **Global:** 100 req/min per IP
✅ **PDF Endpoint:** 10 req/hour per IP  
✅ **Headers:** Rate limit info in every response
✅ **429 Response:** Clear error message with retry time
✅ **Whitelisting:** Localhost excluded
✅ **Configurable:** Easy to adjust in one file

Your API is now protected from abuse while remaining accessible to legitimate users! 🛡️

