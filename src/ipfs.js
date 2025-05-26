// IPFS Service using Pinata Cloud
// Make sure to set your environment variable: REACT_APP_PINATA_JWT

// Get Pinata JWT from environment variables
const PINATA_JWT ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjYmExNDYwYS01OGM0LTRhNWYtODExYy1lNDc4NmRjMjczMjkiLCJlbWFpbCI6InByYXNpbmR1ZGVzaGFuMUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMWNhMDU1MzZlOTIyYWU3OTI3MTQiLCJzY29wZWRLZXlTZWNyZXQiOiIxOTg5ZmJiNjcyZDJlMjgzOThlZjljY2ZjMzNiYjEyMDc2N2Y3YjE3ZGMyZDcyZTM4NTI2ZmE5MzlmNzg5ZWY1IiwiZXhwIjoxNzc5ODExMTQ1fQ.PvvYtrarlApq9b99WpfTxMZ74Vs6WS_I3o9V0DtUGNE';

// Pinata API endpoints
const PINATA_BASE_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud';

// Create a mock hash for development when Pinata is not configured
const createMockHash = (file) => {
  const timestamp = Date.now();
  const fileInfo = `${file.name}-${file.size}-${timestamp}`;
  return `mock-${btoa(fileInfo).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;
};

// Store mock files in memory (since localStorage is not available in artifacts)
const mockStorage = new Map();

// Main upload function using Pinata
export const uploadToIPFS = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum 10MB allowed.');
    }

    // Check if Pinata JWT is configured
    if (!PINATA_JWT) {
      console.warn('Pinata JWT not configured, using mock mode');
      return handleMockUpload(file);
    }

    // Create FormData for Pinata upload
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size.toString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Optional: Add pinning options
    const options = JSON.stringify({
      cidVersion: 1,
      customPinPolicy: {
        // You can add custom pin policies here if needed
      }
    });
    formData.append('pinataOptions', options);

    console.log('Uploading to Pinata...');

    // Upload to Pinata
    const response = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        // Don't set Content-Type header - let the browser set it for FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata upload failed:', errorText);
      throw new Error(`Failed to upload to Pinata: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Successfully uploaded to Pinata:', result);

    // Return the IPFS hash (CID)
    return result.IpfsHash;

  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    
    // Fallback to mock mode if Pinata fails
    if (error.message.includes('Pinata') || error.message.includes('fetch')) {
      console.warn('Falling back to mock mode due to Pinata error');
      return handleMockUpload(file);
    }
    
    throw error;
  }
};

// Handle mock upload for development
const handleMockUpload = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const mockHash = createMockHash(file);
      const dataUrl = reader.result;
      
      // Store in memory instead of localStorage
      mockStorage.set(`ipfs-mock-${mockHash}`, dataUrl);
      
      console.log(`Mock upload successful: ${mockHash}`);
      resolve(mockHash);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file for mock upload'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Get IPFS URL with multiple gateway options
export const getIPFSURL = (hash, gateway = 'pinata') => {
  if (!hash) {
    throw new Error('Hash is required to generate IPFS URL');
  }
  
  // Handle mock hashes
  if (hash.startsWith('mock-')) {
    const mockData = mockStorage.get(`ipfs-mock-${hash}`);
    if (mockData) {
      return mockData; // Return the data URL directly
    }
    
    // Return a placeholder SVG if mock data is not available
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f0f0f0"/>
        <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14" fill="#666">
          Mock Image
        </text>
        <text x="100" y="120" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="10" fill="#999">
          ${hash.substring(0, 20)}...
        </text>
      </svg>
    `)}`;
  }
  
  // Available IPFS gateways
  const gateways = {
    pinata: `${PINATA_GATEWAY}/ipfs/${hash}`,
    cloudflare: `https://cloudflare-ipfs.com/ipfs/${hash}`,
    ipfs: `https://ipfs.io/ipfs/${hash}`,
    dweb: `https://dweb.link/ipfs/${hash}`,
    infura: `https://ipfs.infura.io/ipfs/${hash}`
  };

  return gateways[gateway] || gateways.pinata;
};

// Get IPFS URL with fallback gateways for better reliability
export const getIPFSURLWithFallback = (hash, preferredGateway = 'pinata') => {
  if (!hash) {
    throw new Error('Hash is required to generate IPFS URL');
  }

  // Handle mock hashes
  if (hash.startsWith('mock-')) {
    return getIPFSURL(hash);
  }

  const gateways = {
    pinata: `${PINATA_GATEWAY}/ipfs/${hash}`,
    cloudflare: `https://cloudflare-ipfs.com/ipfs/${hash}`,
    ipfs: `https://ipfs.io/ipfs/${hash}`,
    dweb: `https://dweb.link/ipfs/${hash}`,
    infura: `https://ipfs.infura.io/ipfs/${hash}`
  };

  return gateways[preferredGateway] || gateways.pinata;
};

// Batch upload function for multiple files
export const uploadMultipleToIPFS = async (files) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided for upload');
    }

    console.log(`Starting batch upload of ${files.length} files...`);

    const uploadPromises = Array.from(files).map(async (file, index) => {
      try {
        const hash = await uploadToIPFS(file);
        return { 
          index, 
          hash, 
          fileName: file.name, 
          success: true 
        };
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        return { 
          index, 
          error: error.message, 
          fileName: file.name, 
          success: false 
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (failed.length > 0) {
      console.warn(`${failed.length} files failed to upload:`, failed);
    }
    
    console.log(`Batch upload complete: ${successful.length} successful, ${failed.length} failed`);
    
    return {
      successful,
      failed,
      totalUploaded: successful.length,
      totalFailed: failed.length
    };
  } catch (error) {
    console.error('Error in batch upload:', error);
    throw error;
  }
};

// Verify if a hash exists and is accessible
export const verifyIPFSHash = async (hash, gateway = 'pinata') => {
  try {
    if (!hash) {
      return { exists: false, error: 'No hash provided' };
    }
    
    // Handle mock hashes
    if (hash.startsWith('mock-')) {
      const mockData = mockStorage.get(`ipfs-mock-${hash}`);
      return {
        exists: !!mockData,
        isMock: true,
        url: getIPFSURL(hash)
      };
    }
    
    // Try to fetch the file to verify it exists
    const url = getIPFSURL(hash, gateway);
    const response = await fetch(url, { method: 'HEAD' });
    
    return {
      exists: response.ok,
      status: response.status,
      url: url,
      isMock: false,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    };
  } catch (error) {
    console.error(`Failed to verify IPFS hash ${hash}:`, error);
    return {
      exists: false,
      error: error.message,
      isMock: false
    };
  }
};

// Check Pinata connection and authentication
export const checkPinataConnection = async () => {
  try {
    if (!PINATA_JWT) {
      return {
        connected: false,
        error: 'Pinata JWT not configured',
        message: 'Set REACT_APP_PINATA_JWT in your environment variables'
      };
    }

    const response = await fetch(`${PINATA_BASE_URL}/data/testAuthentication`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        connected: true,
        message: data.message || 'Connected to Pinata successfully'
      };
    } else {
      return {
        connected: false,
        error: `Authentication failed: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      connected: false,
      error: `Connection failed: ${error.message}`
    };
  }
};

// Get Pinata account usage (optional)
export const getPinataUsage = async () => {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT not configured');
    }

    const response = await fetch(`${PINATA_BASE_URL}/data/userPinnedDataTotal`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to get usage data: ${response.status}`);
    }
  } catch (error) {
    console.error('Error getting Pinata usage:', error);
    throw error;
  }
};

// Preload images for better UX
export const preloadIPFSImage = (hash, gateway = 'pinata') => {
  return new Promise((resolve, reject) => {
    if (!hash) {
      reject(new Error('No hash provided'));
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from IPFS: ${hash}`));
    img.src = getIPFSURL(hash, gateway);
  });
};

// Utility function to convert File to ArrayBuffer
export const fileToArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

// Get setup instructions for Pinata
export const getSetupInstructions = () => {
  return {
    service: 'Pinata Cloud',
    message: 'To use IPFS functionality with Pinata, you need to configure your API key',
    steps: [
      '1. Go to https://pinata.cloud and create an account',
      '2. Navigate to the API Keys section in your dashboard',
      '3. Create a new API key with the following permissions:',
      '   - pinFileToIPFS: enabled',
      '   - pinJSONToIPFS: enabled (optional)',
      '   - userPinnedDataTotal: enabled (optional, for usage stats)',
      '4. Copy the JWT token (not the API key and secret)',
      '5. Create a .env file in your project root',
      '6. Add the following environment variable:',
      '   REACT_APP_PINATA_JWT=your_jwt_token_here',
      '7. Restart your development server',
      '',
      'Note: Keep your JWT token secure and never commit it to version control!'
    ],
    currentStatus: PINATA_JWT ? 'JWT configured ✅' : 'JWT not configured ❌'
  };
};

// Clear mock data (for development)
export const clearMockIPFSData = () => {
  try {
    mockStorage.clear();
    console.log('Cleared all mock IPFS data');
  } catch (error) {
    console.error('Error clearing mock IPFS data:', error);
  }
};

// Export configuration status
export const getIPFSStatus = async () => {
  const pinataStatus = await checkPinataConnection();
  
  return {
    service: 'Pinata Cloud',
    configured: !!PINATA_JWT,
    connected: pinataStatus.connected,
    mockMode: !PINATA_JWT,
    message: pinataStatus.message || pinataStatus.error,
    gateway: PINATA_GATEWAY
  };
};