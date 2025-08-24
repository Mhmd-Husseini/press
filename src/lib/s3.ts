import { 
  S3Client, 
  PutObjectCommand,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// Configure S3 client to use IAM role credentials only
// When IAM role is attached to EC2, AWS SDK automatically uses it
const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION as string,
});

const BUCKET_NAME = process.env.AWS_BUCKET as string;
const S3_URL = process.env.AWS_URL as string;

/**
 * Uploads a file to S3 and returns the URL
 * This function can only be called from server-side code
 */
export async function uploadToS3(
  file: File,
  folder: string = ''
): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error('uploadToS3 can only be called from server-side code');
  }

  // Validate environment variables
  if (!BUCKET_NAME) {
    throw new Error('AWS_BUCKET environment variable is not set');
  }
  if (!process.env.AWS_DEFAULT_REGION) {
    throw new Error('AWS_DEFAULT_REGION environment variable is not set');
  }
  if (!S3_URL) {
    throw new Error('AWS_URL environment variable is not set');
  }

  const fileExtension = file.name.split('.').pop() || '';
  const fileName = `${folder ? `${folder}/` : ''}${randomUUID()}.${fileExtension}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
  };

  try {
    console.log('Attempting S3 upload:', {
      bucket: BUCKET_NAME,
      key: fileName,
      region: process.env.AWS_DEFAULT_REGION,
      fileSize: buffer.length,
      contentType: file.type
    });

    await s3Client.send(new PutObjectCommand(params));
    
    const fullUrl = `${S3_URL}/${fileName}`;
    console.log('S3 upload successful:', fullUrl);
    
    return fullUrl;
  } catch (error) {
    console.error('Error uploading to S3:', {
      error: error instanceof Error ? error.message : error,
      bucket: BUCKET_NAME,
      region: process.env.AWS_DEFAULT_REGION,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes a file from S3
 * This function can only be called from server-side code
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  if (typeof window !== 'undefined') {
    throw new Error('deleteFromS3 can only be called from server-side code');
  }

  // Extract the key from the URL
  const key = fileUrl.replace(`${S3_URL}/`, '');

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
} 