import {APIGatewayProxyResult} from "aws-lambda";
import {
    apigw,
    docClient,
    getConnectionIdByNickname,
    getNicknameToNickname,
    MESSAGES_TABLE_NAME, postToConnection,
    responseOK
} from "./helpers";
import {Client, GetMessagesBody, SendMessageBody} from "./types";
import {HandlerError} from "./HandleError";
import {v4} from "uuid";
import exp from "node:constants";

export const handleSendMessage = async (client: Client, body: SendMessageBody):Promise<APIGatewayProxyResult> => {
    const nicknameToNickname = getNicknameToNickname([
        client.nickname,
        body.recipientNickname,
    ]);

    await docClient
        .put({
            TableName: MESSAGES_TABLE_NAME,
            Item: {
                messageId: v4(),
                nicknameToNickname,
                message: body.message,
                sender: client.nickname,
                createdAt: new Date().getTime(),
            },
        })
        .promise();

    const recipientConnectionId = await getConnectionIdByNickname(
        body.recipientNickname,
    );

    if (recipientConnectionId) {
        await apigw
            .postToConnection({
                ConnectionId: recipientConnectionId,
                Data: JSON.stringify({
                    type: "message",
                    value: {
                        sender: client.nickname,
                        message: body.message,
                    },
                }),
            })
            .promise();
    }

    return responseOK;
};

export const handleGetMessages = async (client: Client, body: GetMessagesBody): Promise<APIGatewayProxyResult> => {
    const output = await docClient
        .query({
            TableName: MESSAGES_TABLE_NAME,
            IndexName: "NicknameToNicknameIndex",
            KeyConditionExpression: "#nicknameToNickname = :nicknameToNickname",
            ExpressionAttributeNames: {
                "#nicknameToNickname": "nicknameToNickname",
            },
            ExpressionAttributeValues: {
                ":nicknameToNickname": getNicknameToNickname([
                    client.nickname,
                    body.targetNickname,
                ]),
            },
            Limit: body.limit,
            ExclusiveStartKey: body.startKey,
            ScanIndexForward: false,
        })
        .promise();

    await postToConnection(
        client.connectionId,
        JSON.stringify({
            type: "messages",
            value: {
                messages: output.Items && output.Items.length > 0 ? output.Items : [],
                lastEvaluatedKey: output.LastEvaluatedKey,
            },
        }),
    );

    return responseOK;
};
export const parseGetMessageBody = (body: string | null): GetMessagesBody => {
    const getMessagesBody = JSON.parse(body || "{}") as GetMessagesBody;

    if (
        !getMessagesBody ||
        !getMessagesBody.targetNickname ||
        !getMessagesBody.limit
    ) {
        throw new HandlerError("GetMessageBody format is incorrect");
    }

    return getMessagesBody;
};

export const parseSendMessageBody = (body: string | null): SendMessageBody => {
    const sendMsgBody = JSON.parse(body || "{}") as SendMessageBody;

    if (!sendMsgBody || !sendMsgBody.recipientNickname || !sendMsgBody.message) {
        throw new HandlerError("invalid SendMessageBody");
    }

    return sendMsgBody;
};
