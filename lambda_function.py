import boto3
import logging
from botocore.exceptions import ClientError
import json
import base64
import urllib

from time import gmtime, strftime

dynamodb = boto3.client('dynamodb', region_name = 'us-east-1')
now = strftime("%a, %d %b %Y %H:%M:%S +0000", gmtime())

# Instantiate logger
logger = logging.getLogger(__name__)

# connect to the Rekognition client
rekognition = boto3.client('rekognition')

def lambda_handler(event, context):

    ev = {
        'S3Bucket': event['Records'][0]['s3']['bucket']['name'],
        'S3Object': urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    }

    try:
        image = None
        if 'S3Bucket' in ev and 'S3Object' in ev:
            s3 = boto3.resource('s3')
            s3_object = s3.Object(ev['S3Bucket'], ev['S3Object'])
            image = s3_object.get()['Body'].read()
            filename = ev['S3Object']

       # elif 'image' in event:
       #     image_bytes = event['image'].encode('utf-8')
       #     img_b64decoded = base64.b64decode(image_bytes)
       #     image = img_b64decoded
       #    filename = ev['S3Object']

        elif image is None:
            raise ValueError('Missing image, check image or bucket path.')

        else:
            raise ValueError("Only base 64 encoded image bytes or S3Object are supported.")

        response = rekognition.detect_labels(Image={'Bytes': image})
        lambda_response = {
            "statusCode": 200,
            "body": json.dumps(response)
        }
        labels = [label['Name'] for label in response['Labels']]
        print("Labels found:")
        print(labels)
        
        dynamodb.put_item(
            TableName = 'RekognitionProjectTable',
            Item = {
                'fileName': {'S': str(filename)},
                'timeEntered': {'S': str(now)},
                'labels': {'SS': labels}
            })

    except ClientError as client_err:

       error_message = "Couldn't analyze image: " + client_err.response['Error']['Message']

       lambda_response = {
           'statusCode': 400,
           'body': {
               "Error": client_err.response['Error']['Code'],
               "ErrorMessage": error_message
           }
       }
       logger.error("Error function %s: %s",
                    context.invoked_function_arn, error_message)


    except ValueError as val_error:

        lambda_response = {
            'statusCode': 400,
            'body': {
                "Error": "ValueError",
                "ErrorMessage": format(val_error)
            }
        }
        logger.error("Error function %s: %s",
                     context.invoked_function_arn, format(val_error))

    return lambda_response
