import boto3
from botocore.exceptions import ClientError
from config import settings
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class MinIOService:
    def __init__(self):
        self.endpoint = settings.MINIO_ENDPOINT
        self.external_endpoint = settings.MINIO_ENDPOINT_EXTERNAL
        self.access_key = settings.MINIO_ACCESS_KEY
        self.secret_key = settings.MINIO_SECRET_KEY
        self.bucket_name = settings.MINIO_BUCKET
        
        self.client = boto3.client(
            's3',
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name='us-east-1',
            config=boto3.session.Config(signature_version='s3v4') # type: ignore
        )
        
        self.external_client = boto3.client(
            's3',
            endpoint_url=self.external_endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name='us-east-1',
            config=boto3.session.Config(signature_version='s3v4') # type: ignore
        )
        
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"Bucket {self.bucket_name} already exists")
        except ClientError:
            self.client.create_bucket(Bucket=self.bucket_name)
            logger.info(f"Bucket {self.bucket_name} created")
    
    def upload_file(self, file_data: bytes, user_id: int, filename: str, content_type: str) -> str:
        import time
        timestamp = int(time.time())
        safe_filename = filename.replace(" ", "_")
        file_path = f"users/{user_id}/{timestamp}_{safe_filename}"
        
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=file_path,
            Body=file_data,
            ContentType=content_type
        )
        logger.info(f"File uploaded: {file_path}")
        return file_path
    
    def get_download_url(self, file_path: str, expires: int = 3600, filename: Optional[str] = None) -> str:
        try:
            if not filename:
                filename = file_path.split('/')[-1]
            
            url = self.external_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_path,
                    'ResponseContentDisposition': f'attachment; filename="{filename}"'
                },
                ExpiresIn=expires
            )
            logger.info(f"Generated download URL for {file_path}")
            return url
        except Exception as e:
            logger.error(f"Error generating URL: {e}")
            raise
    
    def delete_file(self, file_path: str):
        self.client.delete_object(
            Bucket=self.bucket_name,
            Key=file_path
        )
        logger.info(f"File deleted: {file_path}")