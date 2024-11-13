import json
import boto3
import os

bucket_name = "docunest-db"

aws_access_key_id = os.environ.get("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.environ.get("AWS_SECRET_ACCESS_KEY")

# Initialize the S3 client
s3 = boto3.client(
    's3',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key
)


data = {
    "name": "John",
    "age": 30,
    "city": "New York"
}

json_file_name = "data.json"
with open(json_file_name, "w") as json_file:
    json.dump(data, json_file)
print(f"Data saved to {json_file_name}")



# Function to upload file to S3
def upload_file_to_s3(file_name, bucket_name, object_name=None):
    try:
        # If S3 object_name was not specified, use the file_name
        if object_name is None:
            object_name = file_name

        # Upload the file
        s3.upload_file(file_name, bucket_name, object_name)
        print(f"File '{file_name}' uploaded to bucket '{bucket_name}' as '{object_name}'.")
    except Exception as e:
        print(f"Error: {e}")

# Upload the JSON file to S3
upload_file_to_s3(json_file_name, bucket_name)