import {APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult} from "aws-lambda";
import {type} from "node:os";
import AWS, {AWSError} from "aws-sdk";

type Action =
    | "getClients"
    | "getMessages"
    | "sendMessage"
    | "$connect"
    | "$disconnect";
type Client = {
    connectionId: string,
    nickname: string,
}
const CLIENT_TABLE_NAME = "Clients";
const responseOK = {
    statusCode: 200,
    body: "",
};
const apiGw = new AWS.ApiGatewayManagementApi({
    endpoint: process.env["WSSAPIGATEWAYENDPOINT"],

});

const docClient = new AWS.DynamoDB.DocumentClient();
export const handle = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const routeKey = event.requestContext.routeKey as Action;
    const connectionId = event.requestContext.connectionId as string;

    switch (routeKey){
        case "$connect":
            return handleConnect(connectionId, event.queryStringParameters);
        case "$disconnect":
            return handleDisconnect(connectionId);
        case "getClients":
            return handleGetClients(connectionId);

        default:
            return {
                statusCode: 500,
                body: JSON.stringify(
                    {
                        message: "Go Serverless v1.0! Your function executed successfully!",
                        input: event,
                    },
                    null,
                    2,
                ),
            };
    }

};

const handleConnect = async (
    connectionId: string,
    queryParams: APIGatewayProxyEventQueryStringParameters | null,
    ):Promise<APIGatewayProxyResult> => {
    if (!queryParams || !queryParams['nickname']){
        return {
            statusCode: 403,
            body: "",
        };
    }

    await docClient.put({
        TableName: CLIENT_TABLE_NAME,
        Item:{
            connectionId,
            nickname: queryParams['nickname'],
        },
    }).promise();

    await notifyClients(connectionId)

    return responseOK

};
const handleDisconnect = async (
    connectionId: string,
):Promise<APIGatewayProxyResult> => {

    await docClient.delete({
        TableName: CLIENT_TABLE_NAME,
        Key:{
            connectionId,
        },
    }).promise();

    await notifyClients(connectionId);

    return responseOK

};

const notifyClients = async (connectionIdToExclude: string) => {
    const clients = await getAllClients();

    await Promise.all(clients.filter((client) => client.connectionId !== connectionIdToExclude).map(async (client) =>{
        await postToConnection(client.connectionId, JSON.stringify(clients))
    }),

    );

    for (const client of clients) {
        if(client .connectionId === connectionIdToExclude){
            continue;
        }
        await postToConnection(client.connectionId, JSON.stringify(clients));

    }
};

const getAllClients = async (): Promise<Client[]> => {
    const output = await docClient.scan({
        TableName: CLIENT_TABLE_NAME
    }).promise();

    const clients = output.Items || [];

    return clients as Client[]
}

const postToConnection = async (connectionId: string, data: string) => {
    try {
        await apiGw.postToConnection({
            ConnectionId: connectionId,
            Data: data,
        }).promise();
    }
    catch (e){
        if((e as AWSError).statusCode !== 410){
            throw e;
        }
        await docClient.delete({
            TableName: CLIENT_TABLE_NAME,
            Key:{
                connectionId,
            },
        }).promise();
    }
}
const handleGetClients = async (connectionId: string):Promise<APIGatewayProxyResult> =>{
    const clients = await getAllClients();

    await postToConnection(connectionId, JSON.stringify(clients));

    return responseOK;
};


