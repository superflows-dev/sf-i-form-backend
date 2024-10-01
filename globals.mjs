const REGION = "AWS_REGION"; //e.g. "us-east-1"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { CloudSearchDomainClient, UploadDocumentsCommand, SearchCommand } from "@aws-sdk/client-cloudsearch-domain";
import { CloudWatchLogsClient, PutLogEventsCommand, GetLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { PutObjectCommand, S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";

const kmsClient = new KMSClient({ region: REGION });

const s3Client = new S3Client({});

const S3_BUCKET_NAME = "AWS_LOG_BUCKET_NAME"

const ddbClient = new DynamoDBClient({ region: REGION });

const TABLE = "DB_TABLE_NAME";
const LOG_GROUP_NAME = "AWS_LOG_GROUP_NAME";

const AUTH_ENABLE = true;
const AUTH_REGION = "AWS_AUTH_REGION";
const AUTH_API = "AWS_AUTH_API";
const AUTH_STAGE = "test";

const USER_PROFILES_API = "kew73ke7ggfstlawrfymxn62hi0jebct";
const USER_PROFILES_SCANBYFIELD_PATH = "/scanbyfield";

const ADMIN_METHODS = BACKEND_ADMIN_METHODS;
const FIELDS = INPUT_FIELDS;
const ENCRYPTED_FIELDS = INPUT_ENCRYPTED_FIELDS;
const SEARCH_INDEX = "S_INDEX";
const SERVER_KEY = "S_KEY";

const DELETE_SEARCH_THRESHOLD = "DELETE_THRESHOLD";

const ENTITY_NAME = "ENTITY_NAME_VALUE";

const CHANGE_ENDPOINT_HOST = "AWS_CHANGE_ENDPOINT.lambda-url.us-east-1.on.aws";
const CHANGE_ENDPOINT_PATH = "/startjob";

const SEARCH_ENDPOINT = "AWS_SEARCH_ENDPOINT";

const ALLOW_DUPLICATE = CREATE_ALLOW_DUPLICATE;

const PRESERVE_LOGS_DAYS = 3;

const RANDOM_NUMBER_MAX_LIMIT = 5;

export { 
    REGION,
    ScanCommand, 
    GetItemCommand, 
    PutItemCommand, 
    UpdateItemCommand,
    DeleteItemCommand,
    QueryCommand,
    ddbClient,
    TABLE, 
    AUTH_ENABLE, 
    AUTH_REGION, 
    AUTH_API, 
    AUTH_STAGE,
    PRESERVE_LOGS_DAYS,
    SERVER_KEY,
    CloudSearchDomainClient,
    UploadDocumentsCommand,
    SearchCommand,
    SEARCH_ENDPOINT,
    CloudWatchLogsClient,
    PutLogEventsCommand,
    LOG_GROUP_NAME,
    ADMIN_METHODS,
    SEARCH_INDEX,
    FIELDS,
    ENCRYPTED_FIELDS,
    GetLogEventsCommand,
    DELETE_SEARCH_THRESHOLD,ALLOW_DUPLICATE,
    CHANGE_ENDPOINT_HOST,
    CHANGE_ENDPOINT_PATH,
    ENTITY_NAME,
    s3Client,
    GetObjectCommand,
    PutObjectCommand,
    ListObjectsV2Command,
    S3_BUCKET_NAME,
    kmsClient,
    EncryptCommand,
    DecryptCommand,
    USER_PROFILES_API,
    USER_PROFILES_SCANBYFIELD_PATH,
    RANDOM_NUMBER_MAX_LIMIT
};