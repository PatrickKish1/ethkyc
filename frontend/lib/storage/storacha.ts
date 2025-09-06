/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from "@storacha/client";

let clientPromise: Promise<unknown> | null = null;
let currentSpace: unknown = null;

export async function getStorachaClient() {
  if (!clientPromise) {
    clientPromise = create();
  }
  return clientPromise;
}

export async function initializeStorachaSpace(email?: string) {
  const client = await getStorachaClient();
  
  // Use default email from env if not provided
  const defaultEmail = email || process.env.STORACHA_DEFAULT_EMAIL;
  if (!defaultEmail) {
    throw new Error('Email is required to initialize space');
  }

  // Login with email first
  console.log('Logging in with email:', defaultEmail);
  const account = await client.login(defaultEmail);
  console.log('Successfully logged in');
  
  // Wait for payment plan if needed
  try {
    await account.plan.wait();
    console.log('Account plan confirmed');
  } catch (error) {
    console.log('Account plan wait failed or not needed:', error);
  }
  
  try {
    // Try to get current space first
    currentSpace = await client.currentSpace();
    console.log('Using existing current space:', currentSpace.did());
    return currentSpace;
  } catch {
    // No current space, check if we have a DID in env to set as current
    if (process.env.DID_STORACHA) {
      try {
        console.log('Setting space from DID_STORACHA env:', process.env.DID_STORACHA);
        await client.setCurrentSpace(process.env.DID_STORACHA);
        currentSpace = await client.currentSpace();
        console.log('Successfully set existing space as current:', currentSpace.did());
        return currentSpace;
      } catch (error) {
        console.warn('Failed to set space from DID_STORACHA:', error);
      }
    }
    
    // Check if we have a predefined space name from env
    const spaceName = process.env.STORACHA_SPACE || 'unikyc-space';
    
    // Create space with account
    console.log('Creating new space:', spaceName);
    const space = await client.createSpace(spaceName, { account });
    console.log('Space created:', space.did());
    
    // Set as current space on the client
    await client.setCurrentSpace(space.did());
    console.log('Space set as current');
    
    currentSpace = space;
    return space;
  }
}

export async function uploadFile(blob: Blob, email?: string): Promise<string> {
  try {
    const client = await getStorachaClient();
    
    // Ensure we have a space
    if (!currentSpace) {
      await initializeStorachaSpace(email);
    }
    
    // Verify client has current space before upload
    try {
      const space = await client.currentSpace();
      if (!space) {
        await initializeStorachaSpace(email);
      }
    } catch {
      await initializeStorachaSpace(email);
    }
    
    const cid = await client.uploadFile(blob);
    return cid.toString();
  } catch (error) {
    console.error('Failed to upload file to Storacha:', error);
    throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function uploadDirectory(files: File[], email?: string): Promise<string> {
  try {
    const client = await getStorachaClient();
    
    // Ensure we have a space
    if (!currentSpace) {
      await initializeStorachaSpace(email);
    }
    
    // Double-check that we have a current space set
    try {
      await client.currentSpace();
    } catch {
      // If still no current space, try to initialize again
      await initializeStorachaSpace(email);
    }
    
    const cid = await client.uploadDirectory(files);
    return cid.toString();
  } catch (error) {
    console.error('Failed to upload directory to Storacha:', error);
    throw new Error(`Directory upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to get IPFS gateway URL
export function getStorachaGatewayUrl(cid: string): string {
  return `https://${cid}.ipfs.storacha.link/`;
}

// Helper function to check if client is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const client = await getStorachaClient();
    await client.currentSpace();
    return true;
  } catch {
    return false;
  }
}


