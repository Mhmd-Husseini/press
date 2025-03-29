import { 
  S3Client, 
  PutObjectCommand,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
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
    await s3Client.send(new PutObjectCommand(params));
    // Return full S3 URL
    return `${S3_URL}/${fileName}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
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