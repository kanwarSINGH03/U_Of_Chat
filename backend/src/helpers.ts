import AWS, {AWSError} from "aws-sdk";

export const docClient = new AWS.DynamoDB.DocumentClient();

export const CLIENTS_TABLE_NAME = "Clients";
export const MESSAGES_TABLE_NAME = "Messages";

export const apigw = new AWS.ApiGatewayManagementApi({
    endpoint: process.env.WSSAPIGATEWAYENDPOINT,
});

export const responseOK = {
    statusCode: 200,
    body: "",
};

export const responseForbidden = {
    statusCode: 403,
    body: "",
};

export const postToConnection = async (
    connectionId: string,
    messageBody: string,
): Promise<boolean> => {
    try {
        await apigw
            .postToConnection({
                ConnectionId: connectionId,
                Data: messageBody,
            })
            .promise();

        return true;
    } catch (e) {
        if (isConnectionNotExistError(e)) {
            await docClient
                .delete({
                    TableName: CLIENTS_TABLE_NAME,
                    Key: {
                        connectionId: connectionId,
                    },
                })
                .promise();

            return false;
        } else {
            throw e;
        }
    }
};

export const isConnectionNotExistError = (e: unknown) =>
    (e as AWSError).statusCode === 410;


export const getNicknameToNickname = (nicknames: string[]) => nicknames.sort().join("#");

export const getConnectionIdByNickname = async (
    nickname: string,
): Promise<string | undefined> => {
    const output = await docClient
        .query({
            TableName: CLIENTS_TABLE_NAME,
            IndexName: "NicknameIndex",
            KeyConditionExpression: "#nickname = :nickname",
            ExpressionAttributeNames: {
                "#nickname": "nickname",
            },
            ExpressionAttributeValues: {
                ":nickname": nickname,
            },
        })
        .promise();

    return output.Items && output.Items.length > 0
        ? output.Items[0].connectionId
        : undefined;
};


