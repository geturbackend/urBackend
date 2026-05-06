import { useState } from 'react';
import { UploadPayload, UploadProgress } from '../types';
import { simulateUpload } from '../services/postsService';

export function useUpload() {
  const [progress, setProgress] = useState<UploadProgress>({
    stage: 'idle',
    percent: 0,
    message: '',
  });

  const upload = async (payload: UploadPayload) => {
    setProgress({ stage: 'uploading', percent: 0, message: 'Uploading your creation…' });
    try {
      await simulateUpload(payload, (pct) => {
        if (pct < 80) {
          setProgress({ stage: 'uploading', percent: pct, message: 'Uploading your creation…' });
        } else {
          setProgress({ stage: 'processing', percent: pct, message: 'Processing & optimising…' });
        }
      });
      setProgress({ stage: 'done', percent: 100, message: 'Published successfully!' });
    } catch {
      setProgress({ stage: 'error', percent: 0, message: 'Upload failed. Please retry.' });
    }
  };

  const reset = () => setProgress({ stage: 'idle', percent: 0, message: '' });

  return { progress, upload, reset };
}