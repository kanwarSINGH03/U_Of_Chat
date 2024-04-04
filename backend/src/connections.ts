import {APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult} from "aws-lambda";

import {
    docClient,
    CLIENTS_TABLE_NAME,
    MESSAGES_TABLE_NAME,
    responseForbidden,
    responseOK,
    getConnectionIdByNickname, postToConnection
} from "./helpers"
import {notifyClientChange} from "./clients";

export const handleConnect = async (
    connectionId: string,
    queryParameters: APIGatewayProxyEventQueryStringParameters | null,
):Promise<APIGatewayProxyResult> => {
    if (!queryParameters || !queryParameters["nickname"]) {
        return responseForbidden;
    }

    const existingConnectionId = await getConnectionIdByNickname(
        queryParameters["nickname"],
    );

    // to not allow duplicate nicknames
    if (
        existingConnectionId &&
        (await postToConnection(
            existingConnectionId,
            JSON.stringify({ type: "ping" }),
        ))
    ) {
        return responseForbidden;
    }

    await docClient
        .put({
            TableName: CLIENTS_TABLE_NAME,
            Item: {
                connectionId,
                nickname: queryParameters["nickname"],
            },
        })
        .promise();

    await notifyClientChange(connectionId);

    return responseOK;
};

export const handleDisconnect = async (connectionId: string): Promise<APIGatewayProxyResult> => {
    await docClient
        .delete({
            TableName: CLIENTS_TABLE_NAME,
            Key: {
                connectionId,
            },
        })
        .promise();

    await notifyClientChange(connectionId);

    return responseOK;
};
