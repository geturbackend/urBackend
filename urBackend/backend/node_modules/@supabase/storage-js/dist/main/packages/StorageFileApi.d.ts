import { StorageError } from '../lib/errors';
import { Fetch } from '../lib/fetch';
import { FileObject, FileOptions, SearchOptions, FetchParameters, TransformOptions, DestinationOptions, FileObjectV2, Camelize, SearchV2Options, SearchV2Result } from '../lib/types';
import BlobDownloadBuilder from './BlobDownloadBuilder';
type FileBody = ArrayBuffer | ArrayBufferView | Blob | Buffer | File | FormData | NodeJS.ReadableStream | ReadableStream<Uint8Array> | URLSearchParams | string;
export default class StorageFileApi {
    protected url: string;
    protected headers: {
        [key: string]: string;
    };
    protected bucketId?: string;
    protected fetch: Fetch;
    protected shouldThrowOnError: boolean;
    constructor(url: string, headers?: {
        [key: string]: string;
    }, bucketId?: string, fetch?: Fetch);
    /**
     * Enable throwing errors instead of returning them.
     *
     * @category File Buckets
     */
    throwOnError(): this;
    /**
     * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
     *
     * @param method HTTP method.
     * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
     * @param fileBody The body of the file to be stored in the bucket.
     */
    private uploadOrUpdate;
    /**
     * Uploads a file to an existing bucket.
     *
     * @category File Buckets
     * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
     * @param fileBody The body of the file to be stored in the bucket.
     * @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
     * @returns Promise with file path and id or error
     *
     * @example Upload file
     * ```js
     * const avatarFile = event.target.files[0]
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .upload('public/avatar1.png', avatarFile, {
     *     cacheControl: '3600',
     *     upsert: false
     *   })
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "path": "public/avatar1.png",
     *     "fullPath": "avatars/public/avatar1.png"
     *   },
     *   "error": null
     * }
     * ```
     *
     * @example Upload file using `ArrayBuffer` from base64 file data
     * ```js
     * import { decode } from 'base64-arraybuffer'
     *
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .upload('public/avatar1.png', decode('base64FileData'), {
     *     contentType: 'image/png'
     *   })
     * ```
     */
    upload(path: string, fileBody: FileBody, fileOptions?: FileOptions): Promise<{
        data: {
            id: string;
            path: string;
            fullPath: string;
        };
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Upload a file with a token generated from `createSignedUploadUrl`.
     *
     * @category File Buckets
     * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
     * @param token The token generated from `createSignedUploadUrl`
     * @param fileBody The body of the file to be stored in the bucket.
     * @param fileOptions Optional file upload options including cacheControl and contentType.
     * @returns Promise with file path and full path or error
     *
     * @example Upload to a signed URL
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .uploadToSignedUrl('folder/cat.jpg', 'token-from-createSignedUploadUrl', file)
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "path": "folder/cat.jpg",
     *     "fullPath": "avatars/folder/cat.jpg"
     *   },
     *   "error": null
     * }
     * ```
     */
    uploadToSignedUrl(path: string, token: string, fileBody: FileBody, fileOptions?: FileOptions): Promise<{
        data: {
            path: string;
            fullPath: any;
        };
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Creates a signed upload URL.
     * Signed upload URLs can be used to upload files to the bucket without further authentication.
     * They are valid for 2 hours.
     *
     * @category File Buckets
     * @param path The file path, including the current file name. For example `folder/image.png`.
     * @param options.upsert If set to true, allows the file to be overwritten if it already exists.
     * @returns Promise with signed upload URL, token, and path or error
     *
     * @example Create Signed Upload URL
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .createSignedUploadUrl('folder/cat.jpg')
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "signedUrl": "https://example.supabase.co/storage/v1/object/upload/sign/avatars/folder/cat.jpg?token=<TOKEN>",
     *     "path": "folder/cat.jpg",
     *     "token": "<TOKEN>"
     *   },
     *   "error": null
     * }
     * ```
     */
    createSignedUploadUrl(path: string, options?: {
        upsert: boolean;
    }): Promise<{
        data: {
            signedUrl: string;
            token: string;
            path: string;
        };
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Replaces an existing file at the specified path with a new one.
     *
     * @category File Buckets
     * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
     * @param fileBody The body of the file to be stored in the bucket.
     * @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
     * @returns Promise with file path and id or error
     *
     * @example Update file
     * ```js
     * const avatarFile = event.target.files[0]
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .update('public/avatar1.png', avatarFile, {
     *     cacheControl: '3600',
     *     upsert: true
     *   })
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "path": "public/avatar1.png",
     *     "fullPath": "avatars/public/avatar1.png"
     *   },
     *   "error": null
     * }
     * ```
     *
     * @example Update file using `ArrayBuffer` from base64 file data
     * ```js
     * import {decode} from 'base64-arraybuffer'
     *
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .update('public/avatar1.png', decode('base64FileData'), {
     *     contentType: 'image/png'
     *   })
     * ```
     */
    update(path: string, fileBody: ArrayBuffer | ArrayBufferView | Blob | Buffer | File | FormData | NodeJS.ReadableStream | ReadableStream<Uint8Array> | URLSearchParams | string, fileOptions?: FileOptions): Promise<{
        data: {
            id: string;
            path: string;
            fullPath: string;
        };
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Moves an existing file to a new path in the same bucket.
     *
     * @category File Buckets
     * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
     * @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
     * @param options The destination options.
     * @returns Promise with success message or error
     *
     * @example Move file
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .move('public/avatar1.png', 'private/avatar2.png')
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "message": "Successfully moved"
     *   },
     *   "error": null
     * }
     * ```
     */
    move(fromPath: string, toPath: string, options?: DestinationOptions): Promise<{
        data: {
            message: string;
        };
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Copies an existing file to a new path in the same bucket.
     *
     * @category File Buckets
     * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
     * @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
     * @param options The destination options.
     * @returns Promise with copied file path or error
     *
     * @example Copy file
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .copy('public/avatar1.png', 'private/avatar2.png')
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "path": "avatars/private/avatar2.png"
     *   },
     *   "error": null
     * }
     * ```
     */
    copy(fromPath: string, toPath: string, options?: DestinationOptions): Promise<{
        data: {
            path: string;
        };
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
     *
     * @category File Buckets
     * @param path The file path, including the current file name. For example `folder/image.png`.
     * @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
     * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
     * @param options.transform Transform the asset before serving it to the client.
     * @returns Promise with signed URL or error
     *
     * @example Create Signed URL
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .createSignedUrl('folder/avatar1.png', 60)
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
     *   },
     *   "error": null
     * }
     * ```
     *
     * @example Create a signed URL for an asset with transformations
     * ```js
     * const { data } = await supabase
     *   .storage
     *   .from('avatars')
     *   .createSignedUrl('folder/avatar1.png', 60, {
     *     transform: {
     *       width: 100,
     *       height: 100,
     *     }
     *   })
     * ```
     *
     * @example Create a signed URL which triggers the download of the asset
     * ```js
     * const { data } = await supabase
     *   .storage
     *   .from('avatars')
     *   .createSignedUrl('folder/avatar1.png', 60, {
     *     download: true,
     *   })
     * ```
     */
    createSignedUrl(path: string, expiresIn: number, options?: {
        download?: string | boolean;
        transform?: TransformOptions;
    }): Promise<{
        data: {
            signedUrl: string;
        };
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
     *
     * @category File Buckets
     * @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
     * @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
     * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
     * @returns Promise with array of signed URLs or error
     *
     * @example Create Signed URLs
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .createSignedUrls(['folder/avatar1.png', 'folder/avatar2.png'], 60)
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": [
     *     {
     *       "error": null,
     *       "path": "folder/avatar1.png",
     *       "signedURL": "/object/sign/avatars/folder/avatar1.png?token=<TOKEN>",
     *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
     *     },
     *     {
     *       "error": null,
     *       "path": "folder/avatar2.png",
     *       "signedURL": "/object/sign/avatars/folder/avatar2.png?token=<TOKEN>",
     *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar2.png?token=<TOKEN>"
     *     }
     *   ],
     *   "error": null
     * }
     * ```
     */
    createSignedUrls(paths: string[], expiresIn: number, options?: {
        download: string | boolean;
    }): Promise<{
        data: {
            error: string | null;
            path: string | null;
            signedUrl: string;
        }[];
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
     *
     * @category File Buckets
     * @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
     * @param options.transform Transform the asset before serving it to the client.
     * @returns BlobDownloadBuilder instance for downloading the file
     *
     * @example Download file
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .download('folder/avatar1.png')
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": <BLOB>,
     *   "error": null
     * }
     * ```
     *
     * @example Download file with transformations
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .download('folder/avatar1.png', {
     *     transform: {
     *       width: 100,
     *       height: 100,
     *       quality: 80
     *     }
     *   })
     * ```
     */
    download<Options extends {
        transform?: TransformOptions;
    }>(path: string, options?: Options): BlobDownloadBuilder;
    /**
     * Retrieves the details of an existing file.
     *
     * @category File Buckets
     * @param path The file path, including the file name. For example `folder/image.png`.
     * @returns Promise with file metadata or error
     *
     * @example Get file info
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .info('folder/avatar1.png')
     * ```
     */
    info(path: string): Promise<{
        data: Camelize<FileObjectV2>;
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Checks the existence of a file.
     *
     * @category File Buckets
     * @param path The file path, including the file name. For example `folder/image.png`.
     * @returns Promise with boolean indicating file existence or error
     *
     * @example Check file existence
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .exists('folder/avatar1.png')
     * ```
     */
    exists(path: string): Promise<{
        data: boolean;
        error: null;
    } | {
        data: boolean;
        error: StorageError;
    }>;
    /**
     * A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
     * This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
     *
     * @category File Buckets
     * @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
     * @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
     * @param options.transform Transform the asset before serving it to the client.
     * @returns Object with public URL
     *
     * @example Returns the URL for an asset in a public bucket
     * ```js
     * const { data } = supabase
     *   .storage
     *   .from('public-bucket')
     *   .getPublicUrl('folder/avatar1.png')
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "publicUrl": "https://example.supabase.co/storage/v1/object/public/public-bucket/folder/avatar1.png"
     *   }
     * }
     * ```
     *
     * @example Returns the URL for an asset in a public bucket with transformations
     * ```js
     * const { data } = supabase
     *   .storage
     *   .from('public-bucket')
     *   .getPublicUrl('folder/avatar1.png', {
     *     transform: {
     *       width: 100,
     *       height: 100,
     *     }
     *   })
     * ```
     *
     * @example Returns the URL which triggers the download of an asset in a public bucket
     * ```js
     * const { data } = supabase
     *   .storage
     *   .from('public-bucket')
     *   .getPublicUrl('folder/avatar1.png', {
     *     download: true,
     *   })
     * ```
     */
    getPublicUrl(path: string, options?: {
        download?: string | boolean;
        transform?: TransformOptions;
    }): {
        data: {
            publicUrl: string;
        };
    };
    /**
     * Deletes files within the same bucket
     *
     * @category File Buckets
     * @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
     * @returns Promise with list of deleted files or error
     *
     * @example Delete file
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .remove(['folder/avatar1.png'])
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": [],
     *   "error": null
     * }
     * ```
     */
    remove(paths: string[]): Promise<{
        data: FileObject[];
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Get file metadata
     * @param id the file id to retrieve metadata
     */
    /**
     * Update file metadata
     * @param id the file id to update metadata
     * @param meta the new file metadata
     */
    /**
     * Lists all the files and folders within a path of the bucket.
     *
     * @category File Buckets
     * @param path The folder path.
     * @param options Search options including limit (defaults to 100), offset, sortBy, and search
     * @param parameters Optional fetch parameters including signal for cancellation
     * @returns Promise with list of files or error
     *
     * @example List files in a bucket
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .list('folder', {
     *     limit: 100,
     *     offset: 0,
     *     sortBy: { column: 'name', order: 'asc' },
     *   })
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": [
     *     {
     *       "name": "avatar1.png",
     *       "id": "e668cf7f-821b-4a2f-9dce-7dfa5dd1cfd2",
     *       "updated_at": "2024-05-22T23:06:05.580Z",
     *       "created_at": "2024-05-22T23:04:34.443Z",
     *       "last_accessed_at": "2024-05-22T23:04:34.443Z",
     *       "metadata": {
     *         "eTag": "\"c5e8c553235d9af30ef4f6e280790b92\"",
     *         "size": 32175,
     *         "mimetype": "image/png",
     *         "cacheControl": "max-age=3600",
     *         "lastModified": "2024-05-22T23:06:05.574Z",
     *         "contentLength": 32175,
     *         "httpStatusCode": 200
     *       }
     *     }
     *   ],
     *   "error": null
     * }
     * ```
     *
     * @example Search files in a bucket
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .from('avatars')
     *   .list('folder', {
     *     limit: 100,
     *     offset: 0,
     *     sortBy: { column: 'name', order: 'asc' },
     *     search: 'jon'
     *   })
     * ```
     */
    list(path?: string, options?: SearchOptions, parameters?: FetchParameters): Promise<{
        data: FileObject[];
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * @experimental this method signature might change in the future
     *
     * @category File Buckets
     * @param options search options
     * @param parameters
     */
    listV2(options?: SearchV2Options, parameters?: FetchParameters): Promise<{
        data: SearchV2Result;
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    protected encodeMetadata(metadata: Record<string, any>): string;
    toBase64(data: string): string;
    private _getFinalPath;
    private _removeEmptyFolders;
    private transformOptsToQueryString;
}
export {};
//# sourceMappingURL=StorageFileApi.d.ts.map