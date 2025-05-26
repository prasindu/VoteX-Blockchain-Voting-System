import { create } from 'ipfs-http-client';

// Create IPFS client with error handling for missing credentials
const createIPFSClient = () => {
  try {
    const projectId =f173263ca5b54830a15495154a290a55;
    const projectSecret =Mcn+cyoDj3WtNYFv4cSr5ZC8tzvryGERojZUvCWmwhipZ4qHRbyOWw;

    console.log("ID:", projectId);
    console.log("SECRET:", projectSecret);



    if (!projectId || !projectSecret) {
      console.warn('IPFS credentials not found. IPFS functionality will be disabled.');
      console.log('To enable IPFS, set the following environment variables:');
      console.log('- REACT_APP_INFURA_PROJECT_ID');
      console.log('- REACT_APP_INFURA_PROJECT_SECRET');
      return null;
    }

    return create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
        authorization: `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString('base64')}`
      }
    });
  } catch (error) {
    console.error('Failed to initialize IPFS client:', error);
    return null;
  }
};



// Initialize IPFS client
const ipfs = createIPFSClient();

// Fallback function for when IPFS is not available
const createMockHash = (file) => {
  // Create a deterministic mock hash based on file properties
  const timestamp = Date.now();
  const fileInfo = `${file.name}-${file.size}-${timestamp}`;
  return `mock-${btoa(fileInfo).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;
};

// Main upload function used by the voting app
export const uploadToIPFS = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    // Validate file type for election/candidate images
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Check file size (max 10MB for images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum 10MB allowed.');
    }

    // If IPFS client is not available, create a mock hash for development
    if (!ipfs) {
      console.warn('IPFS client not available. Creating mock hash for development...');
      const mockHash = createMockHash(file);
      console.log(`Mock hash created: ${mockHash}`);
      
      // Store the file in localStorage for development (not recommended for production)
      try {
        const reader = new FileReader();
        reader.onload = () => {
          localStorage.setItem(`ipfs-mock-${mockHash}`, reader.result);
        };
        reader.readAsDataURL(file);
      } catch (e) {
        console.warn('Could not store file in localStorage:', e);
      }
      
      return mockHash;
    }

    console.log(`Uploading ${file.name} to IPFS...`);
    
    // Upload to IPFS with pinning enabled
    const added = await ipfs.add(file, {
      pin: true,
      cidVersion: 1 // Use CID v1 for better compatibility
    });
    
    console.log(`Successfully uploaded to IPFS: ${added.path}`);
    console.log(`File size: ${added.size} bytes`);
    
    // Return the hash (path) as expected by the existing code
    return added.path;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
};

// Get IPFS URL using Infura gateway (as used in the current code)
export const getIPFSURL = (hash) => {
  if (!hash) {
    throw new Error('Hash is required to generate IPFS URL');
  }
  
  // Handle mock hashes for development
  if (hash.startsWith('mock-')) {
    try {
      const mockData = localStorage.getItem(`ipfs-mock-${hash}`);
      if (mockData) {
        return mockData; // Return the data URL directly
      }
    } catch (e) {
      console.warn('Could not retrieve mock file:', e);
    }
    // Return a placeholder image if mock data is not available
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
  
  return `https://ipfs.infura.io/ipfs/${hash}`;
};

// Alternative function with multiple gateway options for better reliability
export const getIPFSURLWithFallback = (hash, preferredGateway = 'infura') => {
  if (!hash) {
    throw new Error('Hash is required to generate IPFS URL');
  }

  // Handle mock hashes
  if (hash.startsWith('mock-')) {
    return getIPFSURL(hash);
  }

  const gateways = {
    infura: `https://ipfs.infura.io/ipfs/${hash}`,
    cloudflare: `https://cloudflare-ipfs.com/ipfs/${hash}`,
    pinata: `https://gateway.pinata.cloud/ipfs/${hash}`,
    dweb: `https://dweb.link/ipfs/${hash}`,
    ipfs: `https://ipfs.io/ipfs/${hash}`
  };

  return gateways[preferredGateway] || gateways.infura;
};

// Batch upload function for multiple files (useful for elections with many candidates)
export const uploadMultipleToIPFS = async (files) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided for upload');
    }

    const uploadPromises = Array.from(files).map(async (file, index) => {
      try {
        const hash = await uploadToIPFS(file);
        return { index, hash, file: file.name, success: true };
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        return { index, error: error.message, file: file.name, success: false };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (failed.length > 0) {
      console.warn(`${failed.length} files failed to upload:`, failed);
    }
    
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

// Function to verify if a hash exists and is accessible
export const verifyIPFSHash = async (hash) => {
  try {
    if (!ipfs) {
      return {
        exists: hash?.startsWith('mock-') || false,
        isMock: hash?.startsWith('mock-') || false,
        error: hash?.startsWith('mock-') ? null : 'IPFS client not initialized'
      };
    }
    
    // Handle mock hashes
    if (hash?.startsWith('mock-')) {
      const mockData = localStorage.getItem(`ipfs-mock-${hash}`);
      return {
        exists: !!mockData,
        isMock: true,
        url: getIPFSURL(hash)
      };
    }
    
    // Try to get file stats to verify it exists
    const stats = await ipfs.files.stat(`/ipfs/${hash}`);
    return {
      exists: true,
      size: stats.size,
      url: getIPFSURL(hash),
      isMock: false
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

// Utility function to check if IPFS client is ready
export const isIPFSReady = () => {
  return ipfs !== undefined && ipfs !== null;
};

// Function to get client status
export const getIPFSStatus = async () => {
  try {
    if (!ipfs) {
      return { 
        ready: false, 
        error: 'IPFS client not initialized',
        mockMode: true,
        message: 'Running in mock mode for development'
      };
    }
    
    const isOnline = await ipfs.isOnline();
    return { 
      ready: true, 
      online: isOnline,
      mockMode: false 
    };
  } catch (error) {
    return { 
      ready: false, 
      error: error.message,
      mockMode: false
    };
  }
};

// Function to preload images for better UX (useful for election/candidate images)
export const preloadIPFSImage = (hash) => {
  return new Promise((resolve, reject) => {
    if (!hash) {
      reject(new Error('No hash provided'));
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from IPFS: ${hash}`));
    img.src = getIPFSURL(hash);
  });
};

// Helper function to convert File to ArrayBuffer for processing
export const fileToArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

// Development helper to clear mock data
export const clearMockIPFSData = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('ipfs-mock-')) {
        localStorage.removeItem(key);
      }
    });
    console.log('Cleared all mock IPFS data');
  } catch (error) {
    console.error('Error clearing mock IPFS data:', error);
  }
};

// Get environment setup instructions
export const getSetupInstructions = () => {
  return {
    message: 'To use IPFS functionality, you need to set up Infura credentials',
    steps: [
      '1. Go to https://infura.io and create an account',
      '2. Create a new IPFS project',
      '3. Get your Project ID and Project Secret',
      '4. Create a .env file in your project root',
      '5. Add the following environment variables:',
      '   REACT_APP_INFURA_PROJECT_ID=your_project_id',
      '   REACT_APP_INFURA_PROJECT_SECRET=your_project_secret',
      '6. Restart your development server'
    ]
  };
};