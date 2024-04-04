import {
    APIGatewayProxyEvent,
    APIGatewayProxyEventQueryStringParameters,
    APIGatewayProxyResult,
} from "aws-lambda";
import AWS, { AWSError } from "aws-sdk";
import { Key } from "aws-sdk/clients/dynamodb";
import { v4 } from "uuid";
import {handleConnect, handleDisconnect} from "./connections";
import {Action} from "./types";
import {postToConnection, responseForbidden, responseOK} from "./helpers";
import {HandlerError} from "./HandleError";
import {handleGetMessages, handleSendMessage, parseGetMessageBody, parseSendMessageBody} from "./messages";
import {getClient, handleGetClients} from "./clients";


export const handle = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    console.log("event:", event);
    const connectionId = event.requestContext.connectionId as string;
    const routeKey = event.requestContext.routeKey as Action;

    try {
        switch (routeKey) {
            case "$connect":
                return handleConnect(connectionId, event.queryStringParameters);
            case "$disconnect":
                return handleDisconnect(connectionId);
            case "getClients":
                return handleGetClients(connectionId);
            case "sendMessage":
                return handleSendMessage(
                  await getClient(connectionId),
                  parseSendMessageBody(event.body),
                );
            case "getMessages":
                return handleGetMessages(
                  await getClient(connectionId),
                  parseGetMessageBody(event.body),
                );
            default:
                return responseForbidden;
        }
    } catch (e) {
        if (e instanceof HandlerError) {
            await postToConnection(
              connectionId,
              JSON.stringify({ type: "error", message: e.message }),
            );
            return responseOK;
        }

        throw e;
    }
};








