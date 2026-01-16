const crypto = require('crypto');

const SECRET = process.env.CDN_SIGNING_SECRET || 'super_secret_signing_key';

class UrlSigner {
    /**
     * Generate a signed URL with expiration
     * @param {string} url - The resource URL
     * @param {number} expirySeconds - TTL in seconds (default 1 hour)
     */
    static sign(url, expirySeconds = 3600) {
        const expires = Math.floor(Date.now() / 1000) + expirySeconds;
        const separator = url.includes('?') ? '&' : '?';
        const dataToSign = `${url}${separator}expires=${expires}`;

        const signature = crypto
            .createHmac('sha256', SECRET)
            .update(dataToSign)
            .digest('hex');

        return `${dataToSign}&signature=${signature}`;
    }

    /**
     * Verify a signed URL
     * @param {string} fullUrl 
     */
    static verify(fullUrl) {
        try {
            const urlObj = new URL(fullUrl, 'http://dummy.com'); // Base needed if relative
            const params = urlObj.searchParams;
            const signature = params.get('signature');
            const expires = parseInt(params.get('expires'), 10);

            if (!signature || !expires) return false;

            // Check Expiry
            if (Date.now() / 1000 > expires) return false;

            // Reconstruct string to sign
            // Remove signature param from validation
            params.delete('signature');
            // Note: URL search params sort order might matter. 
            // For simplicity here we assume simple reconstruction or we'd just strip &signature=... suffix if at end.

            // Re-signing logic here needs to match exactly how it was constructed.
            // Simplified: reconstruct from base + params (excluding signature)
            // Ideally, we'd loop params.

            // To be robust:
            // We assume the URL provided is what we need to check.
            // But stripping query param in JS URL object might change order.

            // Construct manually from original string logic:
            const unsignedUrl = fullUrl.replace(`&signature=${signature}`, '').replace(`?signature=${signature}`, '');

            const expectedSignature = crypto
                .createHmac('sha256', SECRET)
                .update(unsignedUrl)
                .digest('hex');

            return signature === expectedSignature;

        } catch (e) {
            return false;
        }
    }
}

module.exports = UrlSigner;
