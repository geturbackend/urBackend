/// <reference lib="dom" />
import { UrBackendClient } from '../client';
import { UploadResponse } from '../types';

/**
 * Module for handling file storage operations in urBackend
 * 
 * @class StorageModule
 * @description Provides methods to upload and delete files in the urBackend storage system.
 * Supports both browser (File/Blob) and Node.js (Buffer) environments.
 * 
 * @example
 * // Initialize the storage module
 * const client = new UrBackendClient({ secretKey: 'sk_live_xxx' });
 * const storage = new StorageModule(client);
 * 
 * // Upload a file (Browser)
 * const fileInput = document.getElementById('fileInput');
 * const result = await storage.upload(fileInput.files[0], 'my-file.pdf');
 * console.log(result.url);
 * 
 * @example
 * // Upload a file (Node.js)
 * const fs = require('fs');
 * const buffer = fs.readFileSync('./document.pdf');
 * const result = await storage.upload(buffer, 'document.pdf');
 */
export class StorageModule {
  /**
   * Creates an instance of StorageModule
   * 
   * @param {UrBackendClient} client - The authenticated urBackend client instance
   * 
   * @example
   * const client = new UrBackendClient({ secretKey: 'sk_live_xxx' });
   * const storage = new StorageModule(client);
   */
  constructor(private client: UrBackendClient) {}

  /**
   * Uploads a file to the urBackend storage
   * 
   * @param {unknown} file - The file to upload. Supports:
   *   - Browser: File, Blob
   *   - Node.js: Buffer
   * @param {string} [filename] - Optional custom filename for the uploaded file
   * @returns {Promise<UploadResponse>} Promise resolving to upload details including URL and file ID
   * 
   * @throws {Error} If file is invalid or missing
   * @throws {Error} If file size exceeds limits
   * @throws {Error} If authentication fails
   * @throws {Error} If storage quota is exceeded
   * 
   * @example
   * // Browser: Upload from file input
   * const fileInput = document.querySelector('input[type="file"]');
   * const file = fileInput.files[0];
   * const result = await storage.upload(file, 'custom-name.pdf');
   * console.log('File URL:', result.url);
   * 
   * @example
   * // Node.js: Upload Buffer
   * const fs = require('fs');
   * const buffer = fs.readFileSync('./image.png');
   * const result = await storage.upload(buffer, 'image.png');
   * console.log('Uploaded:', result.fileId);
   * 
   * @example
   * // Upload without custom filename (uses original name)
   * const result = await storage.upload(file);
   * 
   * @example
   * // Upload with error handling
   * try {
   *   const result = await storage.upload(file, 'document.pdf');
   *   console.log('Upload successful:', result.url);
   * } catch (error) {
   *   console.error('Upload failed:', error.message);
   *   // Handle error: retry, show user message, etc.
   * }
   */
  public async upload(file: unknown, filename?: string): Promise<UploadResponse> {
    const formData = new FormData();

    if (
      typeof window === 'undefined' &&
      typeof Buffer !== 'undefined' &&
      Buffer.isBuffer(file)
    ) {
      // In Node.js environment, convert Buffer to Blob for standard FormData
      const blob = new Blob([file as unknown as BlobPart]);
      formData.append('file', blob, filename || 'file');
    } else {
      // Browser File/Blob or Node.js Blob/File
      formData.append('file', file as unknown as Blob, filename);
    }

    return this.client.request<UploadResponse>('POST', '/api/storage/upload', {
      body: formData,
      isMultipart: true,
    });
  }

  /**
   * Deletes a file from storage by its path
   * 
   * @param {string} path - The file path or URL of the file to delete
   * @returns {Promise<{ deleted: boolean }>} Promise resolving to deletion status
   * 
   * @throws {Error} If path is empty or invalid
   * @throws {Error} If file does not exist
   * @throws {Error} If authentication fails
   * @throws {Error} If user lacks permission to delete the file
   * 
   * @example
   * // Delete a file by path
   * const result = await storage.deleteFile('uploads/document.pdf');
   * if (result.deleted) {
   *   console.log('File deleted successfully');
   * }
   * 
   * @example
   * // Delete with error handling
   * try {
   *   const result = await storage.deleteFile('uploads/old-file.jpg');
   *   console.log('Deleted:', result.deleted);
   * } catch (error) {
   *   console.error('Deletion failed:', error.message);
   * }
   * 
   * @example
   * // Delete after upload
   * const uploadResult = await storage.upload(file, 'temp-file.pdf');
   * console.log('Uploaded:', uploadResult.url);
   * 
   * // Later, delete the file
   * await storage.deleteFile('temp-file.pdf');
   * console.log('File cleaned up');
   */
  public async deleteFile(path: string): Promise<{ deleted: boolean }> {
    return this.client.request<{ deleted: boolean }>('DELETE', '/api/storage/file', {
      body: { path },
    });
  }
}